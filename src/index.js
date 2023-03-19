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
    todos: [],
  });

  return response.status(201).json(users);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
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
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = user.todos.find((todo) => {
    return todo.id === Number(id);
  });

  if (!todo) {
    return response.status(404).json({ error: "ToDo não encontrada!" });
  }

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(200).send();
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
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
});

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
