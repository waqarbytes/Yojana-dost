import app from "../dist/expressApp.js";

export default function handler(req, res) {
  return app(req, res);
}
