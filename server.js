require('dotenv').config()
const express = require('express')

const app = express()
app.use(express.json())

const riders = []
const drivers = []
const trips = []

function Rider(firstName, lastName, xCoordinate, yCoordinate) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.xCoordinate = xCoordinate;
    this.yCoordinate = yCoordinate;
}

function Driver(firstName, lastName, availability, xCoordinate, yCoordinate) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.availability = availability
    this.xCoordinate = xCoordinate;
    this.yCoordinate = yCoordinate;
}

function Trip(rider, driver) {
    this.rider = rider;
    this.driver = driver;
}

app.post('/register/rider', (req, res) => {
    try {
        const rider = new Rider(req.body.firstName, req.body.lastName, req.body.xCoordinate, req.body.yCoordinate);
        riders.push(rider);
        res.sendStatus(201);
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }

    console.log(riders);
})

app.post('/register/driver', (req, res) => {
    try {
        const driver = new Driver(req.body.firstName, req.body.lastName, true, req.body.xCoordinate, req.body.yCoordinate);
        drivers.push(driver);
        res.sendStatus(201);
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
    console.log(drivers);
})

app.post('/trip', (req, res) => {
    const rider = riders.find((rider) => {
        return rider.firstName == req.body.firstName && rider.lastName == req.body.lastName;
    })
    if (!rider) res.status(404).json({
        message: 'Rider Not Found'
    })
    if (!drivers) res.status(404).json({
        message: 'Drivers Not Found'
    })


    try {
        let minDistance = Infinity;
        let driverFound;
        for (const driver of drivers) {
            if (driver.availability == true) {
                let distance = Math.sqrt(Math.pow(driver.xCoordinate - req.body.xCoordinate, 2) + Math.pow(driver.yCoordinate - req.body.yCoordinate, 2));
                if (distance <= parseInt(process.env.THRESHOLD_DIST) && distance < minDistance) {
                    minDistance = distance;
                    driverFound = driver;
                }

            }
        }
        if (!driverFound) res.status(404).json({
            message: 'Driver Not Found within range'
        })
        const trip = new Trip(rider, driverFound);
        trips.push(trip);
        driverFound.availability = false;
        res.sendStatus(200);

    } catch (error) {
        res.status(500).json();
    }

    console.log(riders);
    console.log(drivers);
    console.log(trips);
})

app.patch('/change-availablity', (req, res) => {
    const driver = drivers.find((driver) => {
        return driver.firstName == req.body.firstName && driver.lastName == req.body.lastName;
    })
    if (!driver) res.status(404).json({
        message: 'Driver Not Found'
    })
    if (req.body.availability === undefined)
        res.sendStatus(400);
    try {
        if (req.body.availability == true) {
            driver.availability = true;
            driver.xCoordinate = req.body.xCoordinate;
            driver.yCoordinate = req.body.yCoordinate;
        } else {
            if (trips.find(trip => { trip.driver == driver }))
                res.sendStatus(400).json({ "error": "Trip Already Present" });
            else
                driver.availability = false;
        }
        res.sendStatus(200);

    } catch (error) {
        res.status(500).json();
    }
    console.log(drivers);
})

app.delete('/trip', (req, res) => {
    const trip = trips.find((trip) => {
        return (trip.rider.firstName == req.body.firstName && trip.rider.lastName == req.body.lastName)
            || (trip.driver.firstName == req.body.firstName && trip.driver.lastName == req.body.lastName);
    })
    if (!trip) res.status(404).json({
        message: 'Trip Not Found'
    })
    try {
        trip.driver.availability = true;
        const index = trips.indexOf(trip);
        trips.splice(index, 1);
        res.sendStatus(204);

    } catch (error) {
        res.status(500).json();
    }
    console.log(drivers);
    console.log(trips);
})

app.listen(9000, () => {
    console.log("Server Started at Port 9000");
})
