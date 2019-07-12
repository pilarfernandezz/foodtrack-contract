/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { FoodContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('FoodContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new FoodContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"food 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"food 1002 value"}'));
    });

    describe('#foodExists', () => {

        it('should return true for a food', async () => {
            await contract.foodExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a food that does not exist', async () => {
            await contract.foodExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createFood', () => {

        it('should create a food', async () => {
            await contract.createFood(ctx, '1003', 'food 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"food 1003 value"}'));
        });

        it('should throw an error for a food that already exists', async () => {
            await contract.createFood(ctx, '1001', 'myvalue').should.be.rejectedWith(/The food 1001 already exists/);
        });

    });

    describe('#readFood', () => {

        it('should return a food', async () => {
            await contract.readFood(ctx, '1001').should.eventually.deep.equal({ value: 'food 1001 value' });
        });

        it('should throw an error for a food that does not exist', async () => {
            await contract.readFood(ctx, '1003').should.be.rejectedWith(/The food 1003 does not exist/);
        });

    });

    describe('#updateFood', () => {

        it('should update a food', async () => {
            await contract.updateFood(ctx, '1001', 'food 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"food 1001 new value"}'));
        });

        it('should throw an error for a food that does not exist', async () => {
            await contract.updateFood(ctx, '1003', 'food 1003 new value').should.be.rejectedWith(/The food 1003 does not exist/);
        });

    });

    describe('#deleteFood', () => {

        it('should delete a food', async () => {
            await contract.deleteFood(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a food that does not exist', async () => {
            await contract.deleteFood(ctx, '1003').should.be.rejectedWith(/The food 1003 does not exist/);
        });

    });

});