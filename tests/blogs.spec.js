const request = require('supertest');
const app = require('../main'); // your Express app
const { connect, cleanup, disconnect } = require('./database'); // your test DB utils

describe('Blog Endpoints', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnect();
  });

  // Helper to create user and get token
  const createUserAndGetToken = async () => {
    const userData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    // Sign up user
    const signupResponse = await request(app)
      .post('/api/auth/v1/signup')
      .send(userData);

    // Sign in user to get token
    const signinResponse = await request(app)
      .post('/api/auth/v1/signin')
      .send({
        email: userData.email,
        password: userData.password,
      });

    return {
      token: signinResponse.body.data?.token || signinResponse.body.token,
      user: signupResponse.body.data?.user || signupResponse.body,
    };
  };

  describe('POST /api/v1/blogs', () => {
    it('should create a new blog for authenticated user', async () => {
      const { token } = await createUserAndGetToken();

      const blogData = {
        title: 'Test Blog',
        description: 'A test blog post',
        body: 'This is the body of the test blog post',
        tags: ['test', 'blog'],
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Blog created successfully!');
      expect(response.body.data).toMatchObject({
        title: blogData.title,
        description: blogData.description,
        body: blogData.body,
        tags: blogData.tags,
        state: 'draft', // default state
      });
    });

    it('should not create blog without authentication', async () => {
      const blogData = {
        title: 'Test Blog',
        description: 'A test blog post',
        body: 'This is the body of the test blog post',
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData);

      expect(response.status).toBe(401);
    });

    it('should not create blog without required fields', async () => {
      const { token } = await createUserAndGetToken();

      const blogData = {
        title: 'Test Blog',
        // missing description and body
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/blogs', () => {
    it('should get all published blogs', async () => {
      const response = await request(app).get('/api/v1/blogs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/v1/blogs?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.pageSize).toBe(5);
    });
  });

  describe('GET /api/v1/blogs/:id', () => {
    it('should return 404 for non-existent blog', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // valid Mongo ObjectId format

      const response = await request(app).get(`/api/v1/blogs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Blog not found');
    });
  });
});
