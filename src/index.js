const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "Username not found" });
  }

  request.user = user;
  return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const user = request.user;
  const totalToDos = user.todos.length + 1;

  if (user.pro === false && totalToDos > 10) {
    return response
      .status(403)
      .json({ error: "Usuário com plano grátis so possui apenas 10 to-do!" });
  } else {
    return next();
  }
}

function checksTodoExists(request, response, next) {
  const { id } = request.params;
  const { username } = request.headers;

  const uuid =
    /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(
      id
    );

  if (uuid === false) {
    return response.status(400).json({ error: "ID informada inválida!" });
  }

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "Username not found" });
  }

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "ToDo not found" });
  }

  request.user = user;
  request.todo = todo;

  return next();
}

function findUserById(request, response, next) {
  const { id } = request.params;
  const user = users.find((user) => user.id === id);

  if (!user) {
    return response.status(404).json({ error: "Id not found" });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userNameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (userNameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  users.push({
    name,
    username,
    id: uuidv4(),
    pro: false,
    todos: [],
  });

  return response.status(201).json(users);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const todos = {
      id: uuidv4(),
      title,
      created_at: new Date(),
      deadline: new Date(deadline),
      done: false,
    };

    user.todos.push(todos);

    return response.status(201).send();
  }
);

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { id } = request.params;
    const { title, deadline } = request.body;
    const { user } = request;

    const todo = user.todos.find((todo) => {
      return todo.id === id;
    });

    if (!todo) {
      return response.status(404).json({ error: "ToDo não encontrada!" });
    }

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(200).send();
  }
);

app.put("/pro", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  user.pro = true;
  return response.status(200).json(user);
});

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;

    const todo = user.todos.find((todo) => {
      return todo.id === Number(id);
    });

    if (!todo) {
      return response.status(404).json({ error: "ToDo não encontrada!" });
    }

    todo.done = true;

    return response.status(200).send();
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find((todo) => {
    return todo.id === Number(id);
  });

  user.todos.splice(todo, 1);

  return response.status(200).send();
});

module.exports = app;
