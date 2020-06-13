//<=========== Import packages ==========>
const express = require("express");
const path = require("path");
const body_parser = require("body-parser");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const config = require("./dbConfig.js");
const multer = require("multer");

const app = express();
const con = mysql.createConnection(config);
var name = "";

const storageOption = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});
const upload = multer({ storage: storageOption }).single("fileUpload");
const upload1 = multer({ storage: storageOption }).array("addfileUpload");

//Middleware
app.use(body_parser.urlencoded({ extended: true })); //when you post service
app.use(body_parser.json());
app.use("/img", express.static(path.join(__dirname, 'img')));
app.use("/style.css", express.static(path.join(__dirname, 'style.css')));
app.use(express.static(path.join(__dirname, "public")));



//Passrord encryption
// app.get("/password/:pass", function (req, res) {
//     const pass = req.params.pass;
//     const salt = 10;

//     bcrypt.hash(pass, salt, function (err, hash) {
//         if (err) {
//             res.status(500).send("Hasshing failed");
//         }
//         else {
//             // console.log(hash.length)
//             res.send(hash);
//         }
//     });
// });


//===========================User================================//

//newest 3 sheet
app.get("/newestsheet", function (req, res) {
    const sql = "SELECT AS_ID,AS_FILE, AS_IMGCOVER,AS_DESC,AS_PAGE,AS_PRICE,AS_DATETIME FROM addsheet ORDER BY AS_DATETIME DESC LIMIT 3";
    con.query(sql, function (err, result, fields) {
        if (err) {
            // console.log(err)
            res.status(500).send("Server error");
        }
        else {
            res.json(result);
            console.log(err)
        }
    });
});


app.post("/uploadsheet", function (req, res) {
    upload(req, res, function (err, result) {
        if (err) {
            res.status(500).send("Upload failed");
            return;
        }
        else {
            // res.json(req.file.filename)
            console.log(req.file.filename)
            file_name=req.file.filename
            const dt = new Date();
            const sql = "INSERT INTO `fiel` (`File_name`, `Status`, `Queue`, `User_id`,`Date`) VALUES ( ?, '0', 1, '1',?);"
            con.query(sql, [file_name,dt], function (err, result, fields) {
                if (err) {
                    res.status(503).send("DB error")
                    console.log(err)
                }
                else {
                    const rows = result.affectedRows;
                    if (rows != 1) {
                        res.status(503).send("Insertion error");
                    }
                    else {
                        res.send("/history")
                        console.log("inset to DB success");
                    }
                }
            });
        }
    })
});


app.post("/uploadsheet1", function (req, res) {
    // const username = req.body.username;
    // const password = req.body.password;
    const dt = new Date();
    // const File_name = req.body.File_name;
    const { File_name, Queue } = req.body;
    const sql = "INSERT INTO `fiel` (`File_name`, `Status`, `Queue`, `User_id`,`Date`) VALUES ( ?, '0', ?, '1',?);"
    con.query(sql, [File_name, Queue, dt], function (err, result, fields) {
        if (err) {
            res.status(503).send("DB error")
            console.log(err)
        }
        else {
            const rows = result.affectedRows;
            if (rows != 1) {
                res.status(503).send("Insertion error");
            }
            else {
                res.send("/history")
                console.log("inset to DB success");
            }
        }
    });
});

///////////////////////////////////////////////////////////////////


//===========================Admin================================//


//Get sheet request
app.get("/request", function (req, res) {
    // const U_ID = req.params.U_ID;
    const sql = "SELECT su.SU_FILE,usr.U_NAME,usr.U_PHONE,usr.U_EMAIL,su.SU_DATETIME,su.SU_STATUS FROM mycopy.sheetupload su,mycopy.user usr WHERE su.U_ID=usr.U_ID";
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.log(err)
            res.status(500).send("Server error");
        }
        else {
            res.json(result);
            console.log(err)
        }
    });
});


//Confirm
app.put("/confirm/:id", function (req, res) {
    const id = req.params.id
    const sql = "UPDATE sheetupload SET SU_STATUS=2 where SU_ID=?"
    con.query(sql, [id], function (err, result, fields) {

        if (err) {
            // console.log("upload failed");
            res.status(500).send("Download failed")
        }
        else {
            res.send("success")
            // console.log("upload done");
        }
    });
});


//Login
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password; // raw password
    // console.log(username+password)
    const sql = "SELECT * FROM user WHERE U_USERNAME=?";
    con.query(sql, [username], function (err, result, fields) {
        if (err) {
            res.status(500).send("Server error");
        }
        else {
            const rows = result.length;
            if (rows != 1) {
                res.status(401).send("No user");
                // console.log(username)
            }
            else {
                // user exitst, check password 
                // console.log(result[0].U_PASSWORD);
                bcrypt.compare(password, result[0].U_PASSWORD, function (err, resp) {
                    console.log(result[0].U_ROLE)

                    if (err) {
                        res.status(503).send("Authen server error")
                    }
                    else if (resp == true) {
                        //login correct
                        //admin or user?
                        if (result[0].U_ROLE == 1) {
                            //console.log("pas")
                            res.send("/admin");
                        }
                        else {
                            res.send("/home2");
                        }
                    }
                    else {
                        //wrong password
                        res.status(403).send("Wrong password");
                    }
                })
            }
        }
    })
})

// Get User Name
// app.get("/Name",function(req, res){
//     // const username = req.params.username;
//     const username=req.body.username
//     const sql = "SELECT U_NAME FROM user where U_USERNAME=?";
//     con.query(sql,[username], function (err, result, fields) {
//         if (err) {
//             // console.log(err)
//             res.status(500).send("Server error");
//         }
//         else {
//             res.json(result);
//         }
//     });
// });


//Sign up

app.post("/signUp", function (req, res) {
    // const username = req.body.username;
    // const password = req.body.password;
    const { U_USERNAME, U_PASSWORD, U_NAME, U_PHONE, U_EMAIL, U_ROLE, S_ID } = req.body;

    //hash password
    bcrypt.hash(U_PASSWORD, 10, function (err, hash) {
        if (err) {
            res.status(500).send("Hasshing failed");
            console.log(err)
        }
        else {
            const sql = "INSERT INTO user (U_USERNAME,U_PASSWORD,U_NAME,U_PHONE,U_EMAIL,U_ROLE,S_ID) VALUES (?,?,?,?,?,2,?)"
            // const sql = "INSERT INTO user (U_USERNAME,U_PASSWORD,U_ROLE,S_ID) VALUES (?,?,1,1)"
            con.query(sql, [U_USERNAME, hash, U_NAME, U_PHONE, U_EMAIL, U_ROLE, S_ID], function (err, result, fields) {
                if (err) {
                    res.status(503).send("DB error")
                    console.log(err)
                }
                else {
                    const rows = result.affectedRows;
                    if (rows != 1) {
                        res.status(503).send("Insertion error");
                    }
                    else {
                        res.send("/home2")
                    }
                }
            });
        }
    });

});

//

//root
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/view/leaflet.html"))
});

app.get("/mapbox", function (req, res) {
    res.sendFile(path.join(__dirname, "/view/mapbox.html"))
});

//<=========== Starting sever ==========>
const PORT = 8080
app.listen(PORT, function () {
    console.log("Sever is running at " + PORT);
});