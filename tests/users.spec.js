

// mock auth middleware so protected routes can be tested
jest.mock('../middleware/authmiddleware', () => ({
  AuthorizeUser: (req, res, next) => {
    req.user = { _id: 'mockUserId', role: 'admin' }; // fake logged in user
    next();
  }
}));

const request = require("supertest");
const app = require("../main");
const { connect } = require("./database");
const Users = require('../models/users.model');

describe('User routes (some protected)', () => {
  let conn;

  beforeAll(async () => {
    conn = await connect();
  });

  afterEach(async () => {
    await conn.cleanup();
  });

  afterAll(async () => {
    await conn.disconnect();
  });

  it("should get all users (protected route)", async () => {
    const mockUsers = [
      {
        _id: "12345",
        first_name: "Fasasi",
        last_name: "Ayinde",
        email: "fasasiayinde98@gmail.com",
        role: "admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    Users.find = jest.fn().mockResolvedValue(mockUsers);

    const response = await request(app)
      .get("/api/v1/users")
      .set('Cookie', ['jwt=mockToken']); // you can fake a cookie if needed

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "users returned successfully!");
    expect(response.body.data).toEqual(mockUsers);
    expect(Users.find).toHaveBeenCalledWith({});
  });

  it("should get user by id (protected route)", async () => {
    const userId = "12345";
    const mockUser = {
      _id: userId,
      first_name: "Fasasi",
      last_name: "Ayinde",
      email: "fasasiayinde98@gmail.com",
      role: "admin",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Users.findById = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app)
      .get(`/api/v1/users/${userId}`)
      .set('Cookie', ['jwt=mockToken']);  // again fake JWT cookie if your auth middleware checks cookies

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "user found successfully");
    expect(response.body.data).toEqual(mockUser);
    expect(Users.findById).toHaveBeenCalledWith(userId);
  });

  // more tests here...

});
