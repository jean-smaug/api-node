const Koa = require("koa");
const Router = require("koa-router");
const StormDB = require("stormdb");

const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");

const multer = require("@koa/multer");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const static = require("koa-static");
const mount = require("koa-mount");
const cors = require("@koa/cors");

const { v4: uuid } = require("uuid");
const mime = require("mime-types");

const app = new Koa();
const router = new Router();
const upload = multer();
const engine = new StormDB.localFileEngine("./stormdb.json");
const db = new StormDB(engine);

const STORAGE_PATH = `${__dirname}/storage`;
const STORAGE_ENDPOINT = `/static`;

if (process.env.NODE_ENV === "development") {
  app.use(logger());
}

/* *******
 * INIT  *
 ******* */

if (!fsSync.existsSync(STORAGE_PATH)) {
  fsSync.mkdirSync(STORAGE_PATH);
}

db.default({ items: [] });

/* *************
 * MIDDLEWARE  *
 ************* */

app.use(cors());
app.use(bodyParser());
app.use(mount(STORAGE_ENDPOINT, static(STORAGE_PATH)));

/* *********
 * ROUTES  *
 ********* */

router.post("/upload", upload.single("image"), async (ctx) => {
  const { name } = ctx.request.body;

  if (!ctx.file) {
    ctx.body = "`image` should contains a file";

    return;
  }

  await fs.writeFile(
    `${STORAGE_PATH}/${
      name
        ? `${name}.${mime.extension(ctx.file.mimetype)}`
        : ctx.file.originalname
    }`,
    ctx.file.buffer
  );

  ctx.status = 201;
});

router.get("/files", async (ctx) => {
  console.log(
    (await fs.readdir(STORAGE_PATH)).map((fileName) =>
      path.basename(fileName, path.extname(fileName))
    )
  );

  ctx.body = (await fs.readdir(STORAGE_PATH)).map(
    (fileName) => `http://localhost:8080${STORAGE_ENDPOINT}/${fileName}`
  );
});

router.get("/files/:name", async (ctx) => {
  const files = (await fs.readdir(STORAGE_PATH)).map((fileName) => {
    const extension = path.extname(fileName);

    return {
      name: path.basename(fileName, extension),
      extension,
    };
  });

  const file = files.find((file) => file.name === ctx.params.name);

  ctx.body = `http://localhost:8080${STORAGE_ENDPOINT}/${file.name}${file.extension}`;
});

router.get("/items", async (ctx) => {
  ctx.body = db.get("items").value() || [];
});

router.post("/items", async (ctx) => {
  const { title, description } = ctx.request.body;

  if (!title || !description) {
    ctx.status = 400;
    ctx.body = "`title` and `description` are required";
  }

  const id = uuid();

  db.get("items")
    .push({
      id,
      title,
      description,
    })
    .save();

  ctx.status = 201;
  ctx.body = { id };
});

router.delete("/items", async (ctx) => {
  db.get("items").delete();

  ctx.status = 204;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(8080, () => console.log("Listen on http://localhost:8080"));
