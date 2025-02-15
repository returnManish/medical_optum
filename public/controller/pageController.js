const patientModel = require('../models/patientModel.js');
const doctorModel = require('../models/doctorModel.js');
const clinicModel = require('../models/clinicModel.js');
const NodeGeocoder = require('node-geocoder');

// import fetch from 'node-fetch';
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const { findOneAndUpdate } = require('../models/doctorModel.js');
const JWT_KEY = 'mykey123';

const options = {
    provider : 'opencage',
    apiKey : '6fa8a2bd2e5c4f6c9824bd1e60c21318'
};
const geocoder = NodeGeocoder(options);

module.exports.getHome = function getHome(req, res) {

    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    return res.render('index.ejs', {
        name: "Homepage" ,
        firstName : firstName,
        userType : userType
    });
}

module.exports.loginPage = function loginPage(req, res){
    if (req.cookies.login){
        if (req.cookies.userType == 'Doctor')
            return res.redirect('/doctorHome');
        else return res.redirect('/patientHome');
    }
    else { 
        return res.render('login.ejs', {
            name : "Login",
            firstName : '',
            userType : ''
        });
    } 
}

module.exports.registerPagePatient = function registerPagePatient(req, res){
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;

    return res.render('registerPatient.ejs', {
        name : "Register Patient",
        firstName : firstName,
        userType : userType
    });
}

module.exports.registerPageDoctor = function registerPageDoctor(req, res){
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    return res.render('registerDoctor.ejs', {
        name : "Register Doctor",
        firstName : firstName,
        userType : userType
    });
}

module.exports.registerPageClinic = async function registerPageClinic(req, res){
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    let allClinics = await clinicModel.find();
    // console.log(allClinics);
    return res.render('registerClinic.ejs', {
        name : "Register Clinic",
        firstName : firstName,
        userType : userType
    });
}

module.exports.patientHome = function patientHome(req, res){
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;

    let quotes = [`There is hope even when your brain tells you there isn't`, 
    `You're like a grey sky. You're beautiful even though you dont want to be`, 
    `Get plenty of sunshine and do things you enjoy to unwind at the end of the day`];
    let idx = Math.floor(Math.random()*4);
    if (idx == 3)
        idx = 2;
    // console.log(idx, quotes[idx])
    return res.render('patientHome.ejs', {
        name : "Patient Profile",
        username : req.cookies.firstName,
        firstName : firstName,
        userType : userType,
        quo : quotes[idx]
    })
}

module.exports.doctorHome = function doctorHome(req, res){
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;

    return res.render('doctorHome.ejs', {
        name : "Doctor Profile",
        username : req.cookies.firstName,
        firstName : firstName,
        userType : userType
    })
}

module.exports.registerClinic = async function registerClinic(req , res){
    let nextId = await clinicModel.countDocuments() + 1;
    // console.log(nextId);
    try{ 
        const resp = await geocoder.geocode({
            address : req.body.address,
            countrycode : "in"
            // city : req.body.city
        });
        let location = resp[0];
        let newClinic = await clinicModel.create({
            id : nextId,
            name : req.body.name,
            email : req.body.email,
            contact : req.body.contact,
            alternate_contact : req.body.alternate_contact,
            address : req.body.address,
            pin : req.body.zipcode,
            city : req.body.city,
            lat : location.latitude,
            long : location.longitude,
            state : location.state
        });
        console.log(newClinic);
        // console.log(newClinic);
        return res.send("done");
        }
    catch(err){
        return res.send(err);
    }
}

module.exports.registerDoctor = async function registerDoctor(req, res){

    try{ 
        let hisClinic = await clinicModel.findOne({
            id : req.body.clinicId
        });
        let hisUtil = Math.floor(Math.random() * (100));
        let newDoc = await doctorModel.create({
            clinicId : req.body.clinicId,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            password : req.body.password,
            email : req.body.email,
            contact : req.body.contact,
            alternate_contact : req.body.alternate_contact,
            state : hisClinic.state,
            city : hisClinic.city,
            lat : hisClinic.lat,
            long : hisClinic.long,
            charges : req.body.charges,
            degree : req.body.degree,
            special : req.body.special,
            pin : hisClinic.pin,
            util : hisUtil
        });
        // console.log(newDoc);
        return res.send('done');
    }
    catch(err){
        return res.send("ERR");
    }
};

module.exports.registerPatient = async function registerPatient(req, res){
    let nextId = await patientModel.countDocuments() + 1;
    const resp = await geocoder.geocode({
        address : req.body.address,
        countrycode : "in"
    });
    try{ 
        let location = resp[0];
        let newUser = await patientModel.create({
            patientId : nextId,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            marital : req.body.marital,
            race : req.body.race,
            ethnicity : req.body.ethnicity,
            gender : req.body.gender,
            age : req.body.age,
            password : req.body.password,
            email : req.body.email,
            contact : req.body.contact,
            alternate_contact : req.body.alternate_contact,
            address : req.body.address,
            pin : location.zipcode,
            city : req.body.city,
            lat : location.latitude,
            long : location.longitude,
            state : location.state,
            country : location.country
        });
        // console.log(newClinic);
        // console.log(location);
        console.log(newUser);
        return res.send("done");
    }catch(err){
        return res.send(err);
    }

}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
function deg2rad(deg) {
    return deg * (Math.PI/180)
}

module.exports.getDocs = async function getDocs(req, res){

    let currUser = await patientModel.findOne({
        patientId : req.cookies.patientId,
        // patientId : "1"
        ////////////////////////////////////
    });
    let allDocs = await doctorModel.find({
        // city : currUser.city,
        special : req.params.sp
    });
    let allClinics = [];
    for(let i = 0; i < allDocs.length; ++i){
        let currClinic = await clinicModel.findOne({
            id : allDocs[i].clinicId
        });
        currClinic.doc = allDocs[i];
        let dist = distance(currClinic.lat, currClinic.long, currUser.lat, currUser.long);
        dist = dist.toString().substring(0, 4);
        // console.log(dist);
        currClinic.dist = dist;
        // console.log(currClinic);
        allClinics.push(currClinic);
    }
    // console.log(allClinics);
    allClinics.sort((a, b) =>
    distance(a.lat, a.long, currUser.lat, currUser.long) -
    distance(b.lat, b.long, currUser.lat, currUser.long)
    );

    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    // console.log(allClinics[0].lat, allClinics[0].long, currUser.lat, currUser.long);
    // console.log(allClinics[1].distance);
    // console.log(allClinics[1].address, currUser.address);
    // console.log(allClinics[0]);
    let colors = [];
    for (var i = 0; i < allClinics.length; ++i){
        if (i % 2)
            colors.push("green");
        else colors.push("");
        allClinics[i].rating = (Math.floor(
            Math.random() * 3 + 3
          )); 
        //   console.log(allClinics[i].rating);
    }
    
    return res.render('allDocs.ejs', {
        name : "Choose your doctor",
        special : req.params.sp,
        clinics : allClinics,
        firstName : firstName,
        userType : userType,
        colors : colors
    });
    return res.json({
        // data : "done",
        special : req.params.sp,
        clinics : allClinics
    });
};

module.exports.selectDoctor = async function selectDoctor(req, res){

    let currDoc = await doctorModel.findById(req.body.docId);
    let currClinic = await clinicModel.find({
        id : currDoc.clinicId
    });
    console.log(req.body.docId);
    // res.cookie.doc = currDoc;
    // return res.render('bookDoctor.ejs', {
    //     name : 'Book Doctor',  
    //     doc : currDoc
    // });
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    return res.render('bookapt.ejs', {
        name : 'Schedule APT',
        clinic : currClinic,
        doc : currDoc,
        firstName : firstName,
        userType : userType
    });
};

module.exports.selectDetails = async function selectDetails(req, res){

    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    let currDoc = await doctorModel.findById(req.params.docId);
    let currClinic = await clinicModel.find({
        id : currDoc.clinicId
    });
    return res.render('bookapt.ejs', {
        name : 'Schedule APT',
        clinic : currClinic,
        doc : currDoc,
        firstName : firstName,
        userType : userType
    });
}

module.exports.bookDoctor = async function bookDoctor(req, res){

    let currDoc = await doctorModel.findById(req.body.doctorId);
    // console.log(currDoc);
    let canBook = true;
    if (currDoc)
        for (var i = 0; i < currDoc.apts.length; ++i){
            if (currDoc.apts[i].date == req.body.date &&
                currDoc.apts[i].time == req.body.time)
                canBook = false;
        }
    // console.log(currDoc)
    // console.log(canBook, currDoc.apts);
    if (req.body.type == 'fb' || canBook == true){
        currDoc.apts.push({
            date : req.body.date,
            time : req.body.time,
            patientId : req.cookies.patientId,
            description : req.body.description,
            type : req.body.type
        });
        let updated = await doctorModel.findByIdAndUpdate(req.body.doctorId, {apts : currDoc.apts});
        // console.log(updated.apts);
        return res.send("RECEIVED");
    }
    else {
        return res.send("CHOOSE ANOTHER SLOT");
    }
    

}

module.exports.showPrescriptions = async function showPrescriptions(req, res){

    try{ 
        let currUser = await patientModel.findOne({
            patientId : req.cookies.patientId
        });
        let firstName = req.cookies.firstName;
        let userType = req.cookies.userType;
        console.log(currUser.records[0]);
        return res.render('viewPrescriptions.ejs', {
            name : "My Medical Records",
            // records : currUser.records,
            records : currUser.records,
            firstName : firstName,
            userType : userType
        });
    }catch(err){
        return res.send(err);
    }
};


module.exports.getChemists = async function getChemists(req, res){
    let currUser = await patientModel.findOne({
        patientId : req.cookies.patientId
        // patientId : "1"
    });
    // console.log(currUser);
    const response = await fetch(`https://api.geoapify.com/v2/places?categories=healthcare.pharmacy,commercial.chemist,healthcare.hospital,healthcare.clinic_or_praxis,commercial.health_and_beauty,healthcare,building.healthcare&bias=proximity:${currUser.long},${currUser.lat}&limit=7&apiKey=c1c4dcb32cc54e2cb89efac279fbb99c`);
    const data = await response.json();
    // return res.render('viewStores.ejs', {
    //     name : "View Stores",
    //     stores : data
    // });
    // console.log(data.features[0]);
    let stores = [];
    for(var i = 0; i < data.features.length; ++i){
        stores.push({
            name : data.features[i].properties.name,
            address : data.features[i].properties.street,
            state : data.features[i].properties.state,
            pincode : data.features[i].properties.postcode,
            distance : data.features[i].properties.distance
        });
    }
    // console.log(stores[0]);
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    // firstName : firstName,
    // userType : userType
    // return res.json(stores);
    return res.render('viewStores.ejs', {
        firstName : firstName,
        userType : userType,
        name : "View Medical Records",
        userType : "Patient",
        stores : stores
    });
};

module.exports.checkRisk = function checkRisk(req, res){

    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;

    return res.render('patientMedicalForm.ejs', {
        name : 'Rehospitalization Risk',
        firstName : firstName,
        userType : userType
    });

}

module.exports.login = async function login(req, res){

    try{
        if (req.body.strUserType == 'Doctor'){
            let currDoc = await doctorModel.findOne({
                email : req.body.email,
                password : req.body.password
            });
            if (currDoc){
                let uid = currDoc['id'];
                let token  = jwt.sign({payload:uid} , JWT_KEY);
                res.cookie('login' , token, {httpOnly:true});
                res.cookie('doctorId', currDoc['id'], {httpOnly:true});
                // res.cookie('patientId', currUser.patientId , {httpOnly : true});
                res.cookie('userType', 'Doctor', {httpOnly : true});
                res.cookie('firstName', currDoc.firstName, {httpOnly : true});
                return res.send('loggedin');
            }
            else {
                return res.send("Invalid Credentials")
            }
        }
        else {
            let currUser = await patientModel.findOne({
                email : req.body.email,
                password : req.body.password
            });
            if (currUser){
                let uid = currUser['id'];
                let token  = jwt.sign({payload:uid} , JWT_KEY);
                res.cookie('login' , token, {httpOnly:true});
                res.cookie('patientId', currUser.patientId , {httpOnly : true});
                res.cookie('userType', 'Patient', {httpOnly : true});
                res.cookie('firstName', currUser.firstName, {httpOnly : true});
                return res.send('loggedin');
            }
            else {
                return res.send("Invalid Credentials")
            }

        }
    }
    catch(err){
        return res.send(err);
    }
};

module.exports.logout = async function logout(req, res){

    res.cookie('patientId' , '' , {maxAge:1});
    res.cookie('userType' , '' , {maxAge:1});
    res.cookie('login' , '' , {maxAge:1});
    res.cookie('firstName', '', {maxAge:1});
    res.cookie('doctorId', '', {maxAge:1});
    return res.redirect('/');
};

module.exports.authPatient = async function authPatient(req, res, next){
    
    if (req.cookies.login){
        if (req.cookies.userType == 'Patient'){
            let currPayload = jwt.verify(req.cookies.login , JWT_KEY).payload;
            let currUser = await patientModel.findById(currPayload);
            if (currUser.patientId == req.cookies.patientId)
                next();
            else {
                return res.json("TRY AGAIN");
            }
        }
        else {
            return res.json("ACCESS DENIED, LOGIN AS PATIENT");
        }

    }
    else {
        return res.json("ACCESS DENIED, LOGIN");
    }
};

module.exports.showFeedbacks = async function showFeedbacks(req, res) {
 
    // let currDoc = await doctorModel.findOne({firstName:req.cookies.firstName});
    let currDoc = await doctorModel.findById(req.cookies.doctorId);
    let allapts = [];
    let words = "";
    for(let i = 0; i < currDoc.apts.length ; i++){
        if (currDoc.apts[i].patientId && currDoc.apts[i].type == 'fb'){
            let currUser = await patientModel.findOne({
                patientId : currDoc.apts[i].patientId
            });
            // console.log(currUser);
            currDoc.apts[i].patientName = currUser.firstName + " " +currUser.lastName;
            currDoc.apts[i].patientContact = currUser.contact;
            currDoc.apts[i].patientEmail = currUser.email;
            currDoc.apts[i].age = currUser.age;
            currDoc.apts[i].patientId = currUser.patientId;
            words = words + " " + currDoc.apts[i].description;
            allapts.push(currDoc.apts[i]);
        }
    }
    // console.log(words);
    // words += "I’m a delicate and sensitive person, and Dr. Sujeeth I was totally impressed by the way I was treated first time when I met him in 2008 and the way he followed up. He is not only an Excellent Doctor , he is simple, superb Human being, Sober, approachable, a Great Social Worker, friendly approach with smiling face with his selfless service with his selfless services. Always amazing treatment. He is an extraordinary intelligent Doctor with human values. Nice advise, hardly find such non commercial Doctors in this era. Apart from dedication , he also has slight wit which impresses me more resulting in great relief from stress while chatting with him. May God bless him and best wishes for the future."
    // words += `Had the exact same procedure done twice. With the exact same insurance. In the same month! I
    // checked with my doctor before both procedures on charges with my insurance. The first one was $130. I
    // paid in full The doctor persuaded me to go to plastics for the 2nd one due to their “comfort levels.” (Doctor insisted
    // both office sides were the same price) So instead of a total bill of $320, it was $785! Not to mention my
    // willingness to pay an extra $60 copay the 2nd time. Guess who got screwed with NO APOLOGY!? I
    // would have been with this place going on 3 years. False claims are NOT taking care of your patients!
    // I cannot express how much I felt slapped in the facel I've never left a negative internet feedback
    // anywhere beforel Terrible way to treat a good person`;

    // words += "Had the exact same procedure done twice. With the exact same insurance. In the same month! |checked with my doctor before both procedures on charges with my insurance. The first one was $130. |paid in full The doctor persuaded me to go to plastics for the 2nd one due to their “comfort levels.” (Doctor insisted both office sides were the same price) So instead of a total bill of $320, it was $785! Not to mention my willingness to pay an extra $60 copay the 2nd time. Guess who got screwed with NO APOLOGY!? |would have been with this place going on 3 years. False claims are NOT taking care of your patients! I cannot express how much I felt slapped in the facel I've never left a negative internet feedback anywhere beforel Terrible way to treat a good person";
    // words += "charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges "
    // words += `gets it. From his excellent treatment, curiosity, investigative mind and ability to connect, you know where you stand immediately and what next steps look like. Attention doctors if you want a masterclass in watching a doctor bring medical knowledge and build rapport so that message is heard by patient and therefore delivered watch this guy.`;
    // words += 'was terrific. Knowledgeable, sensitive, informative… I immediately felt at ease – and felt confident in my receiving expert medical care. Staff was great, too. Walked away, very impressed w. the overall experience. HIGHLY recommend.';
    // words += "Great experience as a first timer. I barely waited to be helped when I checked in. The staff and Dr. (Name) were all very friendly and helpful. I especially loved how Dr. (Name) really took his time to explain my conditions with me as well as my treatment options. I had a great visit and the doctor’s demeanor has really put me at ease so I highly recommend this clinic.";
    // words += "Great experience as a first timer. I barely waited to be helped when I checked in. The staff and Dr. (Name) were all very friendly and helpful. I especially loved how Dr. (Name) really took his time to explain my conditions with me as well as my treatment options. I had a great visit and the doctor’s demeanor has really put me at ease so I highly recommend this clinic.";
    // words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    // words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    // words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    // words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    // words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."

    // console.log(words);
    let input = words;
    const exclude = ["to", "is", "for", "you", "the", "your", "an", "on", "by", "this", "will", "of", "a", "and", "i", "my", "in", "", "with", "that","from", "was" , "name"];

    const lowerAlphaNum = input.replace(/['"\.,-\/|#!$%\^&\*;:{}=\-_``~()]/g, "").toLowerCase();
    const filtered = lowerAlphaNum.split(" ").filter(word => exclude.indexOf(word) === -1);
    const frequencies = {};
    filtered.forEach(word => {
    frequencies[word] = (frequencies[word] || 0) + 1;
    });
    // console.log(typeof frequencies)
    // const sortedArr = Object.keys(frequencies).map(word => ({
    // word: word,
    // frequency: frequencies[word]
    // })).sort((a, b) => b.frequency - a.frequency);
    // console.log(sortedArr);
    // let word = [[]];
    // sortedArr.forEach(item => {
    // // console.log(item.word + ': ' + item.frequency);
    // word.push([item.word , item.frequency])
    // });;
    // console.log(word)
    // console.log(currDoc);
    // const trimmedArr = sortedArr.slice(1, 20);
    // console.log(trimmedArr[0]);
    // console.log(trimmedArr);
    // console.log(trimmedArr[0]);
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    return res.render('checkFeedbacks.ejs', {
        name: "Acknowledge Patient Feedbacks " ,
        firstName : firstName,
        userType : userType,
        apts: allapts,
        list : frequencies
    });
};
 
module.exports.showAppointments = async function showAppointments(req, res) {
 
    let currDoc = await doctorModel.findById(req.cookies.doctorId);
    let allapts = [];
    for(let i = 0 ; i<currDoc.apts.length ; i++){
        if (currDoc.apts[i].patientId && currDoc.apts[i].type != 'fb'){
            let currUser = await patientModel.findOne({
                patientId : currDoc.apts[i].patientId
            });
            // console.log(currUser);
            currDoc.apts[i].patientName = currUser.firstName + " " +currUser.lastName;
            currDoc.apts[i].patientContact = currUser.contact;
            currDoc.apts[i].patientEmail = currUser.email;
            currDoc.apts[i].age = currUser.age;
            currDoc.apts[i].patientId = currUser.patientId;
            allapts.push(currDoc.apts[i]);
        }
    }
    // console.log(allapts[0].patientId, allapts[])
    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;
    return res.render('checkAppointments.ejs', {
        name: "My Appointments" ,
        firstName : firstName,
        userType : userType,
        apts: allapts
    });
};

module.exports.authDoctor = async function authDoctor(req, res, next){
    try{ 
        if (req.cookies.login){
            if (req.cookies.userType == 'Doctor'){
                let currPayload = jwt.verify(req.cookies.login , JWT_KEY).payload;
                // console.log(currPayload)
                let currDoc = await doctorModel.findById(currPayload);
                // console.log(currDoc);
                if (currDoc['id'] == req.cookies.doctorId)
                    next();
                else {
                    return res.json("TRY AGAIN");
                }
            }
            else {
                return res.json("ACCESS DENIED, LOGIN AS DOCTOR");
            }

        }
        else {
            return res.json("ACCESS DENIED, LOGIN");
        }
    }catch(err){
        console.log(err);
    }
};

module.exports.enterDetails = async function enterDetails(req, res){

    let firstName = req.cookies.firstName;
    let userType = req.cookies.userType;

    return res.render('addPrescription.ejs', {
        name : 'Add Medical Report',
        userType : userType,
        firstName : firstName
    })
};

module.exports.giveReport = async function giveReport(req, res){

    // return res.send("done");
    let currDoc = await doctorModel.findById(req.cookies.doctorId);
    let currClinic = await clinicModel.findOne({
        id : currDoc.clinicId
    });
    let currUser = await patientModel.findOne({
        patientId : req.body.patientId
    });

    if (!currUser || !currClinic)
        return res.send("error");

    // console.log(req.body.dosage);
    // console.log(req.body.mpr);
    // console.log(req.body.mtr)
    // console.log(req.body.major_disease);
    let currRecord = {};
    currRecord.dr_name = currDoc.firstName + " " + currDoc.lastName;
    currRecord.special = currDoc.special;
    currRecord.hospital = currClinic.name;
    currRecord.add = currClinic.address;
    currRecord.major_disease = req.body.major_disease;
    currRecord.date_from = req.body.date_from;
    currRecord.date_to = req.body.date_to;
    currRecord.mpf = req.body.mpf;
    let cost = 0;
    currRecord.dosage = [];
    currRecord.mtr = [];
    for (let i = 0; i < req.body.dosage.length; ++i){
        let x = "";
        if (req.body.dosage[i].morning)
            x += 'M';
        if (req.body.dosage[i].afternoon)
            x += 'A';
        if (req.body.dosage[i].dinner)
            x += 'D';
        currRecord.dosage.push(
            req.body.dosage[i].name + " " + x
            );

        cost += req.body.dosage[i].cost;
    }

    for (let i = 0; i < req.body.mtr.length; ++i){
        currRecord.mtr.push(
            req.body.mtr[i].name
        );
        // console.log(req.body.mtr[i].cost);
        cost += parseInt(req.body.mtr[i].cost);
    };
    // console.log(currRecord.major_disease);
    // console.log(currRecord.mtr);
    // console.log(currRecord.date_from, currRecord.date_to);
    // console.log(currRecord);
    cost += parseInt(currDoc.charges);
    // console.log(cost);
    cost += currUser.expenses;
    let allRecords = currUser.records;
    allRecords.push(currRecord);
    let updatedUser = await patientModel.findOneAndUpdate({
        patientId : currUser.patientId
    },
    {
        records : allRecords,
        expenses : cost
    })

    // console.log(updatedUser);
    return res.send("done");
    
    
};

module.exports.cloud = async function cloud(req, res){

    let words = "";
    words += "I’m a delicate and sensitive person, and Dr. Sujeeth I was totally impressed by the way I was treated first time when I met him in 2008 and the way he followed up. He is not only an Excellent Doctor , he is simple, superb Human being, Sober, approachable, a Great Social Worker, friendly approach with smiling face with his selfless service with his selfless services. Always amazing treatment. He is an extraordinary intelligent Doctor with human values. Nice advise, hardly find such non commercial Doctors in this era. Apart from dedication , he also has slight wit which impresses me more resulting in great relief from stress while chatting with him. May God bless him and best wishes for the future."
    words += `Had the exact same procedure done twice. With the exact same insurance. In the same month! I
    checked with my doctor before both procedures on charges with my insurance. The first one was $130. I
    paid in full The doctor persuaded me to go to plastics for the 2nd one due to their “comfort levels.” (Doctor insisted
    both office sides were the same price) So instead of a total bill of $320, it was $785! Not to mention my
    willingness to pay an extra $60 copay the 2nd time. Guess who got screwed with NO APOLOGY!? I
    would have been with this place going on 3 years. False claims are NOT taking care of your patients!
    I cannot express how much I felt slapped in the facel I've never left a negative internet feedback
    anywhere beforel Terrible way to treat a good person`;

    words += "Had the exact same procedure done twice. With the exact same insurance. In the same month! |checked with my doctor before both procedures on charges with my insurance. The first one was $130. |paid in full The doctor persuaded me to go to plastics for the 2nd one due to their “comfort levels.” (Doctor insisted both office sides were the same price) So instead of a total bill of $320, it was $785! Not to mention my willingness to pay an extra $60 copay the 2nd time. Guess who got screwed with NO APOLOGY!? |would have been with this place going on 3 years. False claims are NOT taking care of your patients! I cannot express how much I felt slapped in the facel I've never left a negative internet feedback anywhere beforel Terrible way to treat a good person";
    words += "charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges charges "
    words += `gets it. From his excellent treatment, curiosity, investigative mind and ability to connect, you know where you stand immediately and what next steps look like. Attention doctors if you want a masterclass in watching a doctor bring medical knowledge and build rapport so that message is heard by patient and therefore delivered watch this guy.`;
    words += 'was terrific. Knowledgeable, sensitive, informative… I immediately felt at ease – and felt confident in my receiving expert medical care. Staff was great, too. Walked away, very impressed w. the overall experience. HIGHLY recommend.';
    words += "Great experience as a first timer. I barely waited to be helped when I checked in. The staff and Dr. (Name) were all very friendly and helpful. I especially loved how Dr. (Name) really took his time to explain my conditions with me as well as my treatment options. I had a great visit and the doctor’s demeanor has really put me at ease so I highly recommend this clinic.";
    words += "Great experience as a first timer. I barely waited to be helped when I checked in. The staff and Dr. (Name) were all very friendly and helpful. I especially loved how Dr. (Name) really took his time to explain my conditions with me as well as my treatment options. I had a great visit and the doctor’s demeanor has really put me at ease so I highly recommend this clinic.";
    words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    words += "Great medical office, wonderful and warm experience from start to finish. Appreciate Dr. (Name) taking time to go over the diagnosis clearly and treatment options. Was referred over by my general doctor and can see why. Highly recommended."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "The services that I receive from (DN) is excellent. Dr. (Name) and the staff are friendly and ensure that I am properly informed about my health and care. I would have no qualms in recommending them to friendly and friends."
    words += "charges  far far far far far far far far far far far far far far far far far far far far far far far far far far far far far far ";
    // words += "charges  far far far far far far far far far far far far far far far far far far far far far far far far far far far far far far ";
    // words += "charges  far far far far far far far far far far far far far far far far far far far far far far far far far far far far far far ";
    let input = words;
    const exclude = ["to", "is", "for", "you", "the", "your", "an", "on", "by", "this", "will", "of", "a", "and", "i", "my", "in", "", "with", "that","from", "was" , "name"];

    const lowerAlphaNum = input.replace(/['"\.,-\/|#!$%\^&\*;:{}=\-_``~()]/g, "").toLowerCase();
    const filtered = lowerAlphaNum.split(" ").filter(word => exclude.indexOf(word) === -1);
    const frequencies = {};
    filtered.forEach(word => {
    frequencies[word] = (frequencies[word] || 0) + 1;
    });
    // console.log(typeof frequencies)

    return res.send(frequencies);
}





// patientId cookie MUST for performing patient operations