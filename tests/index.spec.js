const request = require("supertest")
const app = require("../main")

describe('Home route', () =>{
    it('should return Jobs APis', async () =>{
        const response = await request(app).get('/')
        expect(response.text).toEqual('jobs api');
    })
})