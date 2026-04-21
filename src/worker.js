import { createUser, listUsers, loginWithPassword } from "./services/user-service.js";
import { json, methodNotAllowed, notFound } from "./utils/response.js";

function parseJsonSafe(request) {
  return request.json().catch(() => null);
}

function getDb(env) {
  return env.apitest_bind || env.APITEST_BIND || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const db = getDb(env);

    if (url.pathname === "/api/test") {
      return json({ ok: true, msg: "backend is working", dbBound: Boolean(db) });
    }

    if (url.pathname === "/api/login") {
      if (request.method !== "POST") return methodNotAllowed();

      const body = await parseJsonSafe(request);
      const username = (body?.username || "").trim();
      const password = (body?.password || "").trim();

      if (!username || !password) {
        return json({ ok: false, msg: "用户名或密码不能为空" }, 400);
      }

      if (!db) return json({ ok: false, msg: "D1 binding not configured" }, 500);

      const user = await loginWithPassword(db, username, password);
      if (!user) {
        return json({ ok: false, msg: "用户名或密码错误" }, 401);
      }

      return json({ ok: true, msg: "登录成功", user });
    }

    if (url.pathname === "/api/users") {
      if (!db) return json({ ok: false, msg: "D1 binding not configured" }, 500);

      const users = await listUsers(db);
      return json({ ok: true, data: users });
    }

    if (url.pathname === "/api/add-user") {
      if (request.method !== "POST") return methodNotAllowed();

      const body = await parseJsonSafe(request);
      const username = (body?.username || "").trim();
      const password = (body?.password || "").trim();

      if (!username || !password) {
        return json({ ok: false, msg: "参数错误：用户名和密码不能为空" }, 400);
      }

      if (!db) return json({ ok: false, msg: "D1 binding not configured" }, 500);

      const result = await createUser(db, username, password);
      return json({ ok: result.ok, msg: result.msg }, result.status);
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    return notFound();
  }
};
