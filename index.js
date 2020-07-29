const express = require('express');
const dotenv = require('dotenv');
const requestPromise = require('request-promise');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const verifayToken = require('./verifayToken');

const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore }, {
    realm: "New-Realm",
    authServerUrl: "http://localhost:8080/auth/",
    sslRequired: "external",
    resource: "client-nodejs",
    verifyTokenAudience: true,
    credentials: {
        secret: "556da94e-a1e2-42ab-999d-824d69db4cb2"
    },
    useResourceRoleMappings: true,
    confidentialPort: 0
});

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());


app.get("/api/auth", (req, res) => {
    const authURL = process.env.SSO_AUTH_URL;
    const clientId = process.env.SSO_CLIENT_ID;
    const scope = process.env.SSO_SCOPE;
    const redirect = process.env.SSO_REDIRECT_URI

    res.send({
        url: `${authURL}?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirect}`
    });
});

app.post('/api/authtoken', (req, res) => {
    const code = req.body.code;
    console.log("/api/authtoken code", code)
    const options = {
        method: "POST",
        uri: process.env.SSO_TOKEN_URL,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded"
        },
        form: {
            grant_type: "authorization_code",
            client_id: process.env.SSO_CLIENT_ID,
            client_secret: process.env.SSO_CLIENT_SECRET,
            redirect_uri: process.env.SSO_REDIRECT_URI,
            scope: process.env.SSO_SCOPE,
            code
        }
    }

    requestPromise(options)
        .then(tokenRes => {
            const response = JSON.parse(tokenRes);
            const { access_token, refresh_token } = response;
            res.status(200).send({ access_token, refresh_token });
        }).catch(err => {
            console.log(`/api/authtoken error ${err.message}`);

            res.status(400).send(err);
        })
})

app.post('/api/refresh', (req, res) => {
    const refresh_token = req.body.refresh_token
    options = {
        method: "POST",
        uri: process.env.SSO_TOKEN_URL,
        form: {
            grant_type: "refresh_token",
            client_id: process.env.SSO_CLIENT_ID,
            refresh_token: refresh_token,
            client_secret: process.env.SSO_CLIENT_SECRET,
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    requestPromise(options)
        .then(response => {
            if (response.statusCode) {
                return res.status(response.statusCode).send('error')
            }

            const body = JSON.parse(response.body)
            const { access_token, refresh_token } = body;
            res.status(200).send({ access_token, refresh_token });
        }).catch(err => {
            console.log(`/api/authtoken error ${err.message}`);
            res.status(400).send(err);
        })
})

app.get("/api/secured", verifayToken, (req, res) => {
    res.status(200).send({ message: "This is secured" });
});



app.listen(5000, () => {
    console.log(`Listening to port 5000... `);
});