const express = require('express');
const UserController = require('../controllers/user.controller');
const LoginController = require('../controllers/login.controller');
const RegisterController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const router = express.Router();
const TestController = require('../fake/controller/testController');
const SateModel = require('../models/state.model');
const OptimizerModel = require('../models/optimizer.model');


// router.get('/hi/dude', routeAccessMiddleware(), UserController.index).name = "DudeRoute";
// router.get('/hi/manager', routeAccessMiddleware(), UserController.manager).name = 'ManagerRoute';
// router.post('/register', RegisterController.register).name = 'RegisterRoute';
// router.post('/login', LoginController.login).name = 'LoginRoute';


router.get('/create-gateway', TestController.Gateway);
router.get('/create-optimizer', TestController.Optimizer);
router.get('/fake', TestController.processArray);
router.post('/add/gateway/optimizer/data', TestController.addFakeGatewayOptimizerData);
router.get('/alter/field', TestController.addManyDataDB);


router.get('/states/upload', async (req, res) => {
    const AllStates = [
        {
            "name": "Meghalaya",
            "country_code": "IN",
            "iso2": "ML",
            "type": "state",
            "latitude": 25.46703080,
            "longitude": 91.36621600
        },
        {
            "name": "Haryana",
            "country_code": "IN",
            "iso2": "HR",
            "type": "state",
            "latitude": 29.05877570,
            "longitude": 76.08560100
        },
        {
            "name": "Maharashtra",
            "country_code": "IN",
            "iso2": "MH",
            "type": "state",
            "latitude": 19.75147980,
            "longitude": 75.71388840
        },
        {
            "name": "Goa",
            "country_code": "IN",
            "iso2": "GA",
            "type": "state",
            "latitude": 15.29932650,
            "longitude": 74.12399600
        },
        {
            "name": "Manipur",
            "country_code": "IN",
            "iso2": "MN",
            "type": "state",
            "latitude": 24.66371730,
            "longitude": 93.90626880
        },
        {
            "name": "Puducherry",
            "country_code": "IN",
            "iso2": "PY",
            "type": "Union territory",
            "latitude": 11.94159150,
            "longitude": 79.80831330
        },
        {
            "name": "Telangana",
            "country_code": "IN",
            "iso2": "TG",
            "type": "state",
            "latitude": 18.11243720,
            "longitude": 79.01929970
        },
        {
            "name": "Odisha",
            "country_code": "IN",
            "iso2": "OR",
            "type": "state",
            "latitude": 20.95166580,
            "longitude": 85.09852360
        },
        {
            "name": "Rajasthan",
            "country_code": "IN",
            "iso2": "RJ",
            "type": "state",
            "latitude": 27.02380360,
            "longitude": 74.21793260
        },
        {
            "name": "Punjab",
            "country_code": "IN",
            "iso2": "PB",
            "type": "state",
            "latitude": 31.14713050,
            "longitude": 75.34121790
        },
        {
            "name": "Uttarakhand",
            "country_code": "IN",
            "iso2": "UT",
            "type": "state",
            "latitude": 30.06675300,
            "longitude": 79.01929970
        },
        {
            "name": "Andhra Pradesh",
            "country_code": "IN",
            "iso2": "AP",
            "type": "state",
            "latitude": 15.91289980,
            "longitude": 79.73998750
        },
        {
            "name": "Nagaland",
            "country_code": "IN",
            "iso2": "NL",
            "type": "state",
            "latitude": 26.15843540,
            "longitude": 94.56244260
        },
        {
            "name": "Lakshadweep",
            "country_code": "IN",
            "iso2": "LD",
            "type": "Union territory",
            "latitude": 10.32802650,
            "longitude": 72.78463360
        },
        {
            "name": "Himachal Pradesh",
            "country_code": "IN",
            "iso2": "HP",
            "type": "state",
            "latitude": 31.10482940,
            "longitude": 77.17339010
        },
        {
            "name": "Delhi",
            "country_code": "IN",
            "iso2": "DL",
            "type": "Union territory",
            "latitude": 28.70405920,
            "longitude": 77.10249020
        },
        {
            "name": "Uttar Pradesh",
            "country_code": "IN",
            "iso2": "UP",
            "type": "state",
            "latitude": 26.84670880,
            "longitude": 80.94615920
        },
        {
            "name": "Andaman and Nicobar Islands",
            "country_code": "IN",
            "iso2": "AN",
            "type": "Union territory",
            "latitude": 11.74008670,
            "longitude": 92.65864010
        },
        {
            "name": "Arunachal Pradesh",
            "country_code": "IN",
            "iso2": "AR",
            "type": "state",
            "latitude": 28.21799940,
            "longitude": 94.72775280
        },
        {
            "name": "Jharkhand",
            "country_code": "IN",
            "iso2": "JH",
            "type": "state",
            "latitude": 23.61018080,
            "longitude": 85.27993540
        },
        {
            "name": "Karnataka",
            "country_code": "IN",
            "iso2": "KA",
            "type": "state",
            "latitude": 15.31727750,
            "longitude": 75.71388840
        },
        {
            "name": "Assam",
            "country_code": "IN",
            "iso2": "AS",
            "type": "state",
            "latitude": 26.20060430,
            "longitude": 92.93757390
        },
        {
            "name": "Kerala",
            "country_code": "IN",
            "iso2": "KL",
            "type": "state",
            "latitude": 10.85051590,
            "longitude": 76.27108330
        },
        {
            "name": "Jammu and Kashmir",
            "country_code": "IN",
            "iso2": "JK",
            "type": "Union territory",
            "latitude": 33.27783900,
            "longitude": 75.34121790
        },
        {
            "name": "Gujarat",
            "country_code": "IN",
            "iso2": "GJ",
            "type": "state",
            "latitude": 22.25865200,
            "longitude": 71.19238050
        },
        {
            "name": "Chandigarh",
            "country_code": "IN",
            "iso2": "CH",
            "type": "Union territory",
            "latitude": 30.73331480,
            "longitude": 76.77941790
        },
        {
            "name": "Dadra and Nagar Haveli and Daman and Diu",
            "country_code": "IN",
            "iso2": "DH",
            "type": "Union territory",
            "latitude": 20.39737360,
            "longitude": 72.83279910
        },
        {
            "name": "Sikkim",
            "country_code": "IN",
            "iso2": "SK",
            "type": "state",
            "latitude": 27.53297180,
            "longitude": 88.51221780
        },
        {
            "name": "Tamil Nadu",
            "country_code": "IN",
            "iso2": "TN",
            "type": "state",
            "latitude": 11.12712250,
            "longitude": 78.65689420
        },
        {
            "name": "Mizoram",
            "country_code": "IN",
            "iso2": "MZ",
            "type": "state",
            "latitude": 23.16454300,
            "longitude": 92.93757390
        },
        {
            "name": "Bihar",
            "country_code": "IN",
            "iso2": "BR",
            "type": "state",
            "latitude": 25.09607420,
            "longitude": 85.31311940
        },
        {
            "name": "Tripura",
            "country_code": "IN",
            "iso2": "TR",
            "type": "state",
            "latitude": 23.94084820,
            "longitude": 91.98815270
        },
        {
            "name": "Madhya Pradesh",
            "country_code": "IN",
            "iso2": "MP",
            "type": "state",
            "latitude": 22.97342290,
            "longitude": 78.65689420
        },
        {
            "name": "Chhattisgarh",
            "country_code": "IN",
            "iso2": "CT",
            "type": "state",
            "latitude": 21.27865670,
            "longitude": 81.86614420
        },
        {
            "name": "Ladakh",
            "country_code": "IN",
            "iso2": "LA",
            "type": "Union territory",
            "latitude": 34.22684750,
            "longitude": 77.56194190
        },
        {
            "name": "West Bengal",
            "country_code": "IN",
            "iso2": "WB",
            "type": "state",
            "latitude": 22.98675690,
            "longitude": 87.85497550
        }
    ];

    for (let index = 0; index < AllStates.length; index++) {
        const state = AllStates[index];
        await SateModel({
            name: state.name,
            country_code: state.country_code,
            iso2: state.iso2,
            type: state.type,
            latitude: state.latitude,
            longitude: state.longitude,
        }).save();
    }
    return res.send('Done...');
});

router.get('/all/optimizers', async (req, res) => {
    const AllOptimizers = await OptimizerModel.find();
    return res.send({ AllOptimizers });
});

router.post('/password', TestController.passwordCheck);


module.exports = router;