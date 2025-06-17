jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}));
const request = require("supertest")
const app= require("../main")
const {connect} = require("./database")
const Users= require('../models/users.model')
describe('', () =>{
    let conn

    beforeAll(async ()=> {
        conn = await connect() //connect to the test database
    })

    afterEach(async () => {
        await conn.cleanup() //clear the database after each test
    })

    afterAll(async () => {
        await conn.disconnect()
    })
  it("should create a new user and return 201 with expected response", async () => {
    const userPayload = {
      first_name: "Fasasi",
      last_name: "Ayinde",
      email: "fasasiayinde98@gmail.com",
      password: "fasasiayinde98@g",
      role: "admin",
    };

    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send(userPayload);

    // For debugging: log the response body
    console.log("Response body:", response.body);

     expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("status", "success");  // check status string
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data.user).toMatchObject({
      first_name: "Fasasi",
      last_name: "Ayinde",
      email: "fasasiayinde98@gmail.com",
      role: "admin"
    });
  });
 it('should return 200 and user data on successful login', async () => {
    // First create the user to login (you can reuse signup logic or directly insert into DB)
    const userData = {
      first_name: "Fasasi",
      last_name: "Ayinde",
      email: "fasasiayinde98@gmail.com",
      password: "fasasiayinde98@g",
      role: "admin"
    };

    // Create user before login test
    await request(app)
      .post('/api/v1/auth/signup')
      .send(userData);

    // Now test login
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    console.log("Login response body:", response.body);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("user");

    expect(response.body.data.user).toMatchObject({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      role: userData.role,
      active: true,
    });

    // Optionally check that password is not exposed in response
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  it('should return 400 if email or password is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: "test@example.com" }); // missing password

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "please provide email or password");
  });

  it('should return 404 if user not found', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: "nonexistent@example.com", password: "somepassword" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it('should return 403 if user is inactive', async () => {
    // Create an inactive user directly in DB (pseudo-code, adjust for your db layer)
    const inactiveUser = await Users.create({
      first_name: "Inactive",
      last_name: "User",
      email: "inactive@example.com",
      password: "password123",
      role: "admin",
      active: false
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: inactiveUser.email, password: "password123" });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message", "user has been deactivated");
  });

  it('should return 400 for invalid password', async () => {
    const userData = {
      first_name: "Valid",
      last_name: "User",
      email: "validuser@example.com",
      password: "correctpassword",
      role: "admin"
    };

    await request(app).post('/api/v1/auth/signup').send(userData);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userData.email, password: "wrongpassword" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "user not found in database or password is invalid");
  });
});
