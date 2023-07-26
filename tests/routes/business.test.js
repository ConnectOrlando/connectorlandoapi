// These imports are generally required for all route tests. I'll explain each.
// I don't this it's necessary to know these deeply. Let's learn by doing.

// supertest is a library that allows us to make requests to our express app.
import supertest from 'supertest';
// app is our express app. We'll use this to make requests.
import app from '../../src/app.js';
// prisma is our database client. We'll use this to create test data.
import prisma from '../../src/tools/prisma.js';

// request is a supertest instance. We'll use this to make requests.
const request = supertest(app);

// each test file should have a describe block. This is a way to group tests.
describe('Business Routes', () => {
  // each test should have a describe block. This is a way to group each case.
  describe('GET /business/:id', () => {
    // each test should have an it block, describing what is being tested.
    it('should retrieve a business', async () => {
      // create a fake business in the database
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          type: 'Test Type',
          mission: 'Test Mission',
        },
      });

      // make a request to the endpoint with the id of the business we created
      const response = await request.get(`/business/${business.id}`);
      // assert that the response is what we expect
      expect(response.status).toBe(200);
      // assert that the response body is what we expect
      expect(response.body.business).toBeInstanceOf(Object);
    });

    // this is an example of a failure test case
    it('should return not found error', async () => {
      // make a request to the endpoint with an id that doesn't exist
      const response = await request.get('/business/100');
      // assert that the response contains the correct error message
      expect(response.body.error.message).toBe(
        'Could not find business with id 100'
      );
    });

    it('should return archived error', async () => {
      // create a fake archived business in the database
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          type: 'Test Type',
          mission: 'Test Mission',
          isArchived: true,
        },
      });

      const response = await request.get(`/business/${business.id}`);
      expect(response.body.error.message).toBe(
        'Business account already deleted'
      );
    });
  });

  describe('POST /business', () => {
    it('should create a business', async () => {
      // this allows us to send a request with a body
      const response = await request.post('/business').send({
        name: 'Test Business',
        type: 'Test Type',
        mission: 'Test Mission',
      });
      expect(response.status).toBe(200);
      expect(response.body.business).toBeInstanceOf(Object);
    });

    it('should require a name', async () => {
      const response = await request.post('/business').send({
        type: 'Test Type',
        mission: 'Test Mission',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });

    it('should require a type', async () => {
      const response = await request.post('/business').send({
        name: 'Test Business',
        mission: 'Test Mission',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });

    it('should require a mission', async () => {
      const response = await request.post('/business').send({
        name: 'Test Business',
        type: 'Test Type',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });
  });

  describe('PATCH /business/:id', () => {
    it('should only update allowed fields', async () => {
      const originalBusiness = await prisma.business.create({
        data: {
          name: 'Test Business',
          type: 'Test Type',
          mission: 'Test Mission',
        },
      });
      const response = await request
        .patch(`/business/${originalBusiness.id}`)
        .send({
          name: 'new name',
          gallery: 'new gallery',
        });
      expect(response.status).toBe(200);

      const newBusiness = await prisma.business.findUnique({
        where: {
          id: originalBusiness.id,
        },
      });
      expect(newBusiness.name).toBe('new name');
      expect(newBusiness.gallery).toBe(originalBusiness.gallery);
    });

    it('should return error if no fields are updated', async () => {
      const response = await request.patch('/business/1234').send({});
      expect(response.body.error.message).toBe('Nothing to update');
    });

    it('should update sucessfully', async () => {
      const oldBusinessInfo = await prisma.business.create({
        data: {
          name: 'oldBusinessName',
        },
      });
      const response = await request
        .patch(`/business/${oldBusinessInfo.id}`)
        .send({
          name: 'newBusinessName',
        });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Successfully updated business');

      const newBusinessInfo = await prisma.business.findUnique({
        where: {
          id: oldBusinessInfo.id,
        },
      });
      expect(newBusinessInfo.name).toBe('newBusinessName');
    });

    it('should return error when provided with invalid id', async () => {
      const response = await request.patch('/business/1234').send({
        name: 'newName',
      });
      expect(response.body.error.message).toBe(
        'Could not find business with id 1234'
      );
    });
  });
});
