const jwt = require('jsonwebtoken');
const requestPromise = require('request-promise');
const { response } = require('express');

const verifayToken = (req, res, next) => {
    let authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(403).send({ auth: false, message: "No token provided" });
    }

    const options = {
        method: "GET",
        url: 'http://localhost:8080/auth/realms/New-Realm/protocol/openid-connect/userinfo',
        headers: {
            'Authorization': req.headers.authorization
        },
        json: true
    }

    requestPromise(options)
        .then(resonse => {
            if (response.statusCode !== 200) {
                return res.status(401).send({ error: 'Not authorized' });
            }
            next();
        }).catch(err => {
            console.log("Verify error", err)
            return res.status(400).send(err);
        })


}

module.exports = verifayToken;