import express from 'express';
import bodyParser from 'body-parser';
import { USERS, ORDERS } from './db.js';
import { authorizationMiddleware } from './middlewares.js';


const app = express();

app.use(bodyParser.json());

/**
 * POST -- create resource
 * req -> input data
 * res -> output data
 */
app.post('/users', (req, res) => {
 const { body } = req;

 console.log(`body`, JSON.stringify(body));

 const isUserExist = USERS.some(el => el.login === body.login);
 if (isUserExist) {
  return res.status(400).send({ message: `user with login ${body.login} already exists` });
 }

 USERS.push(body);

 res.status(200).send({ message: 'User was created' });
});

app.get('/users', (req, res) => {
 const users = USERS.map(user => {
  const { password, ...other } = user;
  return other;
 });
 return res
  .status(200)
  .send(users);
});

app.post('/login', (req, res) => {
 const { body } = req;

 const user = USERS
  .find(el => el.login === body.login && el.password === body.password);

 if (!user) {
  return res.status(400).send({ message: 'User was not found' });
 }

 const token = crypto.randomUUID();

 user.token = token;
 USERS.save(user.login, { token });

 return res.status(200).send({
  token,
  message: 'User was login'
 });
});

app.get('/orders', authorizationMiddleware, (req, res) => {
 const { user } = req;

 const orders = ORDERS.filter(el => el.login === user.login);

 return res.status(200).send(orders);
});

//Task 1
app.get("/address/from/last-5", authorizationMiddleware, (req, res) => {
  const { user } = req;
  const userOrders = ORDERS.filter(order => order.login === user.login);
  const uniqueFromAddresses = [...new Set(userOrders.map(order => order.from))];
  const last5UniqueFromAddresses = uniqueFromAddresses.slice(-5).reverse();
  return res.status(200).json(last5UniqueFromAddresses);
});
app.listen(8080, () => console.log('Server was started'));

//Task 2
app.get("/address/to/last-3", authorizationMiddleware, (req, res) => {
  const { user } = req;
  const userOrders = ORDERS.filter(order => order.login === user.login);
  const uniqueToAddresses = [...new Set(userOrders.map(order => order.to))];
  const last3UniqueToAddresses = uniqueToAddresses.slice(-3).reverse();
  return res.status(200).json(last3UniqueToAddresses);
});

//Task 3
app.post('/orders', authorizationMiddleware, (req, res) => {
  const { body, user } = req;

  function getRandomArbitrary(){

    return Math.floor(Math.random() * (100 - 20 + 1)) + 20;
  }
 
  const order = {
   ...body,
   login: user.login,
   Price: getRandomArbitrary()
  };

  console.log(order);
 
  ORDERS.push(order);
 
  return res.status(200).send({ message: 'Order was created', order });
 });

// Task 4
app.get("/orders/lowest", authorizationMiddleware, (req, res) => {
  const { user } = req;
  const userOrders = ORDERS.filter(order => order.login === user.login);
  
  if (!user) {
    return res.status(400).json({ message: `User was not found by token: ${req.headers.authorization}` });
  }

  if (userOrders.length === 0) {
    return res.status(404).json({ message: 'User does not have orders yet' });
  }

  const lowestOrder = userOrders.reduce((acc, cur) => cur.Price < acc.Price ? cur : acc);
  return res.status(200).json(lowestOrder);
});

// Task 5
app.get("/orders/biggest", authorizationMiddleware, (req, res) => {
  const { user } = req;
  const userOrders = ORDERS.filter(order => order.login === user.login);

  if (!user) {
    return res.status(400).json({ message: `User was not found by token: ${req.headers.authorization}` });
  }

  if (userOrders.length === 0) {
    return res.status(404).json({ message: 'User does not have orders yet' });
  }

  const biggestOrder = userOrders.reduce((acc, cur) => cur.Price > acc.Price ? cur : acc);
  return res.status(200).json(biggestOrder);
});
