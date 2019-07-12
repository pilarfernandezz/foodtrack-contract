/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FoodContract extends Contract {
    constructor() {
        super();
        this.userAuthenticated = null
    }

    async foodExists(ctx, barCode) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        const buffer = await ctx.stub.getState(barCode);
        return (!!buffer && buffer.length > 0);
    }

    async userExists(ctx, _document) {
        const buffer = await ctx.stub.getState(_document);
        return (!!buffer && buffer.length > 0);
    }

    async createUser(ctx, _document, _name, _password, _telephone, _documentType, _userFunction) {
        if (await this.userExists(ctx, _document)) {
            throw new Error(`The user ${_document} already exists`);
        }
        const user = { document: _document, name: _name, password: _password, telephone: _telephone, documentType: _documentType, userFuncion: _userFunction };
        const buffer = Buffer.from(JSON.stringify(user));
        await ctx.stub.putState(_document, buffer);
    }

    async login(ctx, _document, password) {
        if (this.userAuthenticated) {
            throw new Error("User is already authenticated");
        }
        if (!await this.userExists(ctx, _document)) {
            throw new Error(`The user ${_document} doesn't exists`);
        }
        const user = JSON.parse((await ctx.stub.getState(_document)).toString());

        if (user != null && user.password == password) {
            this.userAuthenticated = user;
            return user;
        }
        return user;

        throw new Error(`WRONG PASSWORD`);
    }

    async logout() {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        this.userAuthenticated = null;
    }

    async createFood(ctx, _barCode, _batch, _name) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        if (await this.foodExists(ctx, _barCode)) {
            throw new Error(`The food ${_barCode} - ${_name} already exists`);
        }

        var dateNow = new Date();

        const food = { barCode: _barCode, name: _name, batch: _batch, trackingSteps: { step: "production", status: true, date: dateNow, foodSituation: "ok" }, incidentSteps: {} };
        const buffer = Buffer.from(JSON.stringify(food));

        await ctx.stub.putState(_barCode, buffer);
    }

    async readFood(ctx, _barCode) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        if (!await this.foodExists(ctx, _barCode)) {
            throw new Error(`The food ${_barCode} does not exist`);
        }
        const buffer = await ctx.stub.getState(_barCode);
        const food = JSON.parse(buffer.toString());
        return food;
    }

    async deleteFood(ctx, _barCode) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        const exists = await this.foodExists(ctx, _barCode);
        if (!exists) {
            throw new Error(`The food ${_barCode} does not exist`);
        }
        await ctx.stub.deleteState(_barCode);
    }
    async updateUser(ctx, _document, _name, _password, _telephone, _documentType, _userFunction) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        const exists = await this.userExists(ctx, _document);
        if (!exists) {
            throw new Error(`The User ${_document} does not exist`);
        }
        const user = { document: _document, name: _name, password: _password, telephone: _telephone, documentType: _documentType, userFuncion: _userFunction };
        const buffer = Buffer.from(JSON.stringify(user));
        await ctx.stub.putState(_document, buffer);
    }

    async deleteUser(ctx, _document) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        const exists = await this.userExists(ctx, _document);
        if (!exists) {
            throw new Error(`The User ${_document} does not exist`);
        }
        await ctx.stub.deleteState(_document);
    }
    async insertNewTrackingStep(ctx, _barCode) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        if (!await this.foodExists(ctx, _barCode)) {
            throw new Error(`The food ${_barCode} doesnt exist`);
        }
        const food = JSON.parse(await ctx.stub.getState(_barCode));
        if (food.trackingSteps == null) {
            food.trackingSteps = {};
        }
         var dateNow = new Date();

        if (food.trackingSteps.length == 0) {
            var trackingStep = { step: "production", status: true, date: dateNow, foodSituation: "ok" };
            food.trackingSteps.push(trackingStep);
        } else {
            console.log(food.trackingSteps.length + "LLLLLLL"+ food.trackingSteps[food.trackingSteps.length - 1]);
            switch (food.trackingSteps[food.trackingSteps.length - 1].step) {
                case "production":
                    food.trackingSteps.push({ step: "transportation", status: true, date: dateNow, foodSituation: "ok" });
                    break;
                case "transportation":
                    food.trackingSteps.push({ step: "saleToSalesman", status: true, date: dateNow, foodSituation: "ok" });
                    break;
                case "saleToSalesman":
                    food.trackingSteps.push({ step: "saleToConsumer", status: true, date: dateNow, foodSituation: "ok" });
                    break;
                default:
                    break;
            }
        }

        const buffer = Buffer.from(JSON.stringify(food));
        await ctx.stub.putState(_barCode, buffer);
    }

    async insertNewIncident(ctx, _barCode, _incidentType, disposalMode) {
        if (this.userAuthenticated == null) {
            throw new Error("User is not authenticated");
        }
        if (!await this.foodExists(ctx, _barCode)) {
            throw new Error(`The food ${_barCode} doesnt exist`);
        }
        const food = JSON.parse(await ctx.stub.getState(_barCode));
        if (food.incidentSteps == null) {
            food.incidentSteps = {};
        }
        var dateNow = new Date();

        switch (_incidentType) {
            case "avariado":
                food.incidentSteps[food.incidentSteps.length] = { step: "damaged", status: true, date: dateNow, disposal: disposalMode };
                food.trackingSteps[food.trackingSteps.length - 1].foodSituation = "damaged";
                break;
            case "vencido":
                food.incidentSteps[food.incidentSteps.length] = { step: "expired", status: true, date: dateNow, disposal: disposalMode };
                food.trackingSteps[food.trackingSteps.length - 1].foodSituation = "expired";
                break;
            case "vetor de doenças":
                food.incidentSteps[food.incidentSteps.length] = { step: "deseasesVector", status: true, date: dateNow, disposal: disposalMode };
                food.trackingSteps[food.trackingSteps.length - 1].foodSituation = "deseasesVector";
                break;
            default:
                break;
        }

        const buffer = Buffer.from(JSON.stringify(food));
        await ctx.stub.putState(_barCode, buffer);
    }
}

module.exports = FoodContract;
