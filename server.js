require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path')
const { Schema } = mongoose;
const session = require('express-session');
const bcrypt = require('bcrypt');
const port = 3019

const app = express();
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if your using https
}));

mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection
db.once('open',()=>{
  console.log("Mongodb connection successful")
})

const highestIdDocSchema = new Schema ({
  User_ID: String,
  account_id: String,
  Librarian_ID: String,
  Book_id: String,
  Author_ID: String,
  Publisher_ID: String,
  Fine_ID: String,
  Checkout_ID: String,
  Transaction_ID: String,
  Reservation_ID: String
}, { versionKey: false });

const HighestIdDocDT = mongoose.model('highestIdDoc', highestIdDocSchema, 'highestIdDoc_tbl');

const AccountSchema = new Schema ({
  account_id: String,
  No_of_Books_Borrowed: Number,
  No_of_Books_Returned: Number,
  No_of_Books_Reserved: Number,
  No_of_Books_Lost: Number,
  Total_Fine_Amount: Number
}, { versionKey: false });

const AccountDT = mongoose.model('Account', AccountSchema, 'account_tbl');

const UserSchema = new Schema ({
  User_ID: String,
  User_Role: String,
  Password: String,
  Name: String,
  Email: String,
  Phone_No: Number,
  Max_Checkout_Limit: Number
}, { versionKey: false });

const UserDT = mongoose.model('User', UserSchema, 'users_tbl');

const LibrarianTBLSchema = new Schema ({
  Librarian_ID: String,
  Librarian_Name: String,
  Librarian_Email: String,
  Phone_No: Number,
  Address: String
}, { versionKey: false });

const LibrarianDT = mongoose.model('librarian', LibrarianTBLSchema, 'librarian_tbl');

const BooksTBLSchema = new Schema ({
  Book_id: String,
  Title: String,
  Author_ID: String,
  Publisher_ID: String,
  Category_ID: String,
  Language: String,
  Copies_Available: Number,
  Book_Status: String
}, { versionKey: false });

const BooksDT = mongoose.model('books', BooksTBLSchema, 'books_tbl');

const AuthorsTBLSchema = new Schema ({
  Author_ID: String,
  Author_Name: String
}, { versionKey: false });

const AuthorsDT = mongoose.model('authors', AuthorsTBLSchema, 'author_tbl');

const PublishersTBLSchema = new Schema ({
  Publisher_ID: String,
  Publisher_Name: String,
  Publisher_Address: String,
  Publisher_Contact_Info: String
}, { versionKey: false });

const PublishersDT = mongoose.model('publishers', PublishersTBLSchema, 'publisher_tbl');

const FinesTBLSchema = new Schema ({
  Fine_ID: String,
  User_ID: String,
  Checkout_ID: String,
  Fine_Amount: Number,
  Payment_Date: Date,
  Reason: String,
  Fine_Status: String
}, { versionKey: false });

const FinesDT = mongoose.model('fines', FinesTBLSchema, 'fine_tbl');

const CheckoutTBLSchema = new Schema ({
  Checkout_ID: String,
  Book_ID: String,
  Checkout_Date: Date,
  Due_Date: Date,
  Return_Date: Date,
  Checkout_Status: String
}, { versionKey: false});

const CheckoutDT = mongoose.model('checkout', CheckoutTBLSchema, 'checkout_tbl')

const ReservationTBLSchema = new Schema ({
  User_ID: String,
  Book_ID: String,
  Priority_Number: String,
  Reservation_Date: Date,
  Reservation_Status: String
}, { versionKey: false});

const ReservationDT = mongoose.model('reservation', ReservationTBLSchema, 'reservation_tbl')

const TransactionTBLSchema = new Schema ({
  Transaction_ID: String,
  User_ID: String,
  Book_ID: String,
  Transaction_Type: String
}, { versionKey: false});

const TransactionDT = mongoose.model('transaction', TransactionTBLSchema, 'transaction_tbl')

const activityLogSchema = new Schema ({
  User_ID: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
}, { versionKey: false });

const ActivityLog = mongoose.model('activitylog', activityLogSchema, 'activity_log_tbl');

app.get('/', (req, res)=>{
  // res.sendFile(path.join(__dirname,'veritas.ejs'))
  res.render('veritas');
})

app.post('/register', async (req, res) => {
  const { name, regemail, regpn, userrole, regpw } = req.body;
  // Check if user with the same email exists
  const existingUser = await UserDT.findOne({ Email: regemail });
  if (existingUser) {
    return res.status(400).send('User with this email already exists');
  } else {
    // Hash the password before saving the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(regpw, salt);

    // Fetch the highest User_ID
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newUserId, newAccountId, newAuthorId, newBookId, newCategoryId, newCheckoutId, newFineId, newLibrarianId, newPublisherId, newReservationId, newTransactionId;
    if (highestIdDoc) {
      // If there is a highest User_ID, increment it and update the document
      const highestUserIdNumber = parseInt(highestIdDoc.User_ID.slice(3));
      newUserId = 'SF-' + (highestUserIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.User_ID = newUserId;
      await highestIdDoc.save();
    } else {
      // If there is no highest User_ID yet, start with SF-1001 and create the document
      newUserId = 'SF-1001';
      await HighestIdDocDT.create({ User_ID: newUserId });
    }

    const newUser = new UserDT({
      User_ID: newUserId, // Store the incremented user id
      User_Role: userrole,
      Password: hashedPassword, // Store the hashed password
      Name: name,
      Email: regemail,
      Phone_No: regpn,
      Max_Checkout_Limit: 5,
    });
    const savedUser = await newUser.save();

    const newAccount = new AccountDT({
      No_of_Books_Borrowed: 0,
      No_of_Books_Returned: 0,
      No_of_Books_Reserved: 0,
      No_of_Books_Lost: 0,
      Total_Fine_Amount:  0,
      User_ID: savedUser.User_ID
    });
    await newAccount.save();

    res.render('veritas');
  }
});

app.post('/login', async (req, res) => {
  let query;
  if (isNaN(req.body.loginemailorphone)) {
    query = { Email: req.body.loginemailorphone };
  } else {
    query = { Phone_No: req.body.loginemailorphone };
  }
  const defaultAdmin = {
    _id: '000000000000000000000000',
    Name: 'Admin',
    email: "admin@admin.com",
    password: "password",
    User_Role: "Admin"
  };
  UserDT.findOne(query)
  .then(async user => {
    if (!user) {
      if (req.body.loginemailorphone === defaultAdmin.email && req.body.loginpw === defaultAdmin.password) {
        req.session.user = defaultAdmin;
        const data = await UserDT.aggregate([
          {
            $lookup:
              {
                from: "account_tbl", // The name of the Account collection
                localField: "User_ID", // The field from the User documents
                foreignField: "account_id", // The field from the Account documents
                as: "account_info" // The output array field
              }
          }
        ]);
        const totalBorrowed = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Borrowed"
              }
            }
          }
        ]);
        const totalReturned = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Returned"
              }
            }
          }
        ]);
        const totalReserved = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Reserved"
              }
            }
          }
        ]);
        const totalLost = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Lost"
              }
            }
          }
        ]);
        const totalFineAmount = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$Total_Fine_Amount"
              }
            }
          }
        ]);
        const totalUsers = await UserDT.countDocuments();
        const totalBooks = await BooksDT.countDocuments();
        const totalapproved = await ReservationDT.countDocuments({ Reservation_Status: 'APPROVED' });
        const totalpending = await ReservationDT.countDocuments({ Reservation_Status: 'PENDING' });
        const totalreservation = await ReservationDT.countDocuments();
        const newLog = new ActivityLog({
          User_ID: defaultAdmin._id,
          action: 'Login',
          details: 'Login Successfully'
        });
        await newLog.save();
        return res.render('dashboard', {
          data,
          user: defaultAdmin,
          totalUsers,
          totalBooks,
          totalapproved,
          totalpending,
          totalreservation,
          totalBorrowed,
          totalReturned,
          totalReserved,
          totalLost,
          totalFineAmount });
      } else {
        return res.status(404).json({ success: false, message: 'Could not find your account' });
      }
    }
    // Compare the password
    const validPassword = await bcrypt.compare(req.body.loginpw, user.Password);
    if (!validPassword) {
      const newLog = new ActivityLog({
        User_ID: user.User_ID,
        action: 'Login',
        details: 'Login Failed'
      });
      await newLog.save();
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    req.session.user = user;
    const newLog = new ActivityLog({
      User_ID: user.User_ID,
      action: 'Login',
      details: 'Login Successfully'
    });
    await newLog.save();
    switch (user.User_Role) {
      case 'Admin':
        const data = await UserDT.aggregate([
          {
            $lookup:
              {
                from: "account_tbl", // The name of the Account collection
                localField: "User_ID", // The field from the User documents
                foreignField: "account_id", // The field from the Account documents
                as: "account_info" // The output array field
              }
          }
        ]);
        const totalBorrowed = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Borrowed"
              }
            }
          }
        ]);
        const totalReturned = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Returned"
              }
            }
          }
        ]);
        const totalReserved = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Reserved"
              }
            }
          }
        ]);
        const totalLost = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$No_of_Books_Lost"
              }
            }
          }
        ]);
        const totalFineAmount = await AccountDT.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$Total_Fine_Amount"
              }
            }
          }
        ]);
        const totalUsers = await UserDT.countDocuments();
        const totalBooks = await BooksDT.countDocuments();
        const totalapproved = await ReservationDT.countDocuments({ Reservation_Status: 'APPROVED' });
        const totalpending = await ReservationDT.countDocuments({ Reservation_Status: 'PENDING' });
        const totalreservation = await ReservationDT.countDocuments();
        res.render('dashboard', {
          data,
          user,
          totalUsers,
          totalBooks,
          totalapproved,
          totalpending,
          totalreservation,
          totalBorrowed,
          totalReturned,
          totalReserved,
          totalLost,
          totalFineAmount
        });
        break;
      case 'Student':
        res.render('studentdashboard', { user });
        break;
      case 'Teacher':
        res.render('teacherdashboard', { user });
        break;
      case 'Staff':
        res.render('staffDashboard', { user });
        break;
      default:
        res.render('defaultDashboard', { user });
    }
  })
  .catch(async err => {
    console.log(err);
    const newLog = new ActivityLog({
      User_ID: 'unknown',
      action: 'Login',
      details: 'Login Error'
    });
    await newLog.save();
    res.status(500).json({ success: false, message: 'Server error' });
  });
});

// CHART
app.get('/chart-data/booksBorrowed', async (req, res) => {
  const accounts = await AccountDT.find({});
  const data = accounts.map(account => account.No_of_Books_Borrowed);
  res.json(data);
});
app.get('/chart-data/booksReturned', async (req, res) => {
  const accounts = await AccountDT.find({});
  const data = accounts.map(account => account.No_of_Books_Returned);
  res.json(data);
});
app.get('/chart-data/booksReserved', async (req, res) => {
  const accounts = await AccountDT.find({});
  const data = accounts.map(account => account.No_of_Books_Reserved);
  res.json(data);
});
app.get('/chart-data/booksLost', async (req, res) => {
  const accounts = await AccountDT.find({});
  const data = accounts.map(account => account.No_of_Books_Lost);
  res.json(data);
});
app.get('/chart-data/fineAmount', async (req, res) => {
  const accounts = await AccountDT.find({});
  const data = accounts.map(account => account.Total_Fine_Amount);
  res.json(data);
});

app.get('/piechart', async (req, res) => {
  const totalborrowed = await AccountDT.countDocuments({ "No_of_Books_Borrowed": { $gt: 0 } });
  const totalreturned = await AccountDT.countDocuments({ "No_of_Books_Returned": { $gt: 0 } });
  const totallost = await AccountDT.countDocuments({ "No_of_Books_Lost": { $gt: 0 } });
  res.json({ totalborrowed, totalreturned, totallost });
});

// ACTIVITY LOGS
app.get('/tableActivityLogs', async (req, res) => {
  const data = await ActivityLog.find();
  const user = await UserDT.findById(req.session.user);
  res.render('activitylogsTBL', { data,  user });
});

// TABLE
app.get('/dashboard', async (req, res) => {
    const user = await UserDT.findById(req.session.user);
    const totalUsers = await UserDT.countDocuments();
    const totalBooks = await BooksDT.countDocuments();
    const totalapproved = await ReservationDT.countDocuments({ Reservation_Status: 'APPROVED' });
    const totalpending = await ReservationDT.countDocuments({ Reservation_Status: 'PENDING' });
    const totalreservation = await ReservationDT.countDocuments();
    const data = await UserDT.aggregate([
      {
        $lookup:
          {
            from: "account_tbl",
            localField: "User_ID",
            foreignField: "account_id",
            as: "account_info"
          }
      }
    ]);
    const totalBorrowed = await AccountDT.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$No_of_Books_Borrowed"
          }
        }
      }
    ]);
    const totalReturned = await AccountDT.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$No_of_Books_Returned"
          }
        }
      }
    ]);
    const totalReserved = await AccountDT.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$No_of_Books_Reserved"
          }
        }
      }
    ]);
    const totalLost = await AccountDT.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$No_of_Books_Lost"
          }
        }
      }
    ]);
    const totalFineAmount = await AccountDT.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$Total_Fine_Amount"
          }
        }
      }
    ]);
    res.render('dashboard', {
      data,
      user,
      totalUsers,
      totalBooks,
      totalapproved,
      totalpending,
      totalreservation,
      totalBorrowed,
      totalReturned,
      totalReserved,
      totalLost,
      totalFineAmount
    });
});

app.get('/tableUsers', async (req, res) => {
  const data = await UserDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('usersTBL', { data,  user });
});

app.get('/tableLibrarian', async (req, res) => {
  const data = await LibrarianDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('librarianTBL', { data,  user});
});

app.get('/tableStudents', async (req, res) => {
  const data = await UserDT.find({ User_Role: 'Student' });
  const user = await UserDT.findById(req.session.user);
  res.render('studentsTBL', { data,  user });
});

app.get('/tableTeachers', async (req, res) => {
  const data = await UserDT.find({ User_Role: 'Teacher' });
  const user = await UserDT.findById(req.session.user);
  res.render('teachersTBL', { data,  user });
});

app.get('/tableStaff', async (req, res) => {
  const data = await UserDT.find({ User_Role: 'Staff' });
  const user = await UserDT.findById(req.session.user);
  res.render('staffTBL', { data,  user });
});

app.get('/tableBooks', async (req, res) => {
  const data = await BooksDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('booksTBL', { data,  user });
});

app.get('/tableAuthors', async (req, res) => {
  const data = await AuthorsDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('authorsTBL', { data,  user });
});

app.get('/tablePublisher', async (req, res) => {
  const data = await PublishersDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('publisherTBL', { data,  user });
});

app.get('/tableFine', async (req, res) => {
  const data = await FinesDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('fineTBL', { data,  user });
});

app.get('/tableCheckout', async (req, res) => {
  const data = await CheckoutDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('checkoutTBL', { data,  user });
});

// CATEGORY
app.get('/tableFiction', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0001'});
  const user = await UserDT.findById(req.session.user);
  res.render('fictionTBL', { data,  user });
});

app.get('/tableMystery', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0002'});
  const user = await UserDT.findById(req.session.user);
  res.render('mysteryTBL', { data,  user });
});

app.get('/tableRomance', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0003'});
  const user = await UserDT.findById(req.session.user);
  res.render('romanceTBL', { data,  user });
});

app.get('/tableSciFi', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0004'});
  const user = await UserDT.findById(req.session.user);
  res.render('scifiTBL', { data,  user });
});

app.get('/tableFantasy', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0005'});
  const user = await UserDT.findById(req.session.user);
  res.render('fantasyTBL', { data,  user });
});

app.get('/tableThriller', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0006'});
  const user = await UserDT.findById(req.session.user);
  res.render('thrillerTBL', { data,  user });
});

app.get('/tableBiography', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0007'});
  const user = await UserDT.findById(req.session.user);
  res.render('biographyTBL', { data,  user });
});

app.get('/tableHorror', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0008'});
  const user = await UserDT.findById(req.session.user);
  res.render('horrorTBL', { data,  user });
});

app.get('/tableHistory', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0009'});
  const user = await UserDT.findById(req.session.user);
  res.render('historyTBL', { data,  user });
});

app.get('/tableNovel', async (req, res) => {
  const data = await BooksDT.find({ Category_ID: 'CT-0010'});
  const user = await UserDT.findById(req.session.user);
  res.render('novelTBL', { data,  user });
});

// USERS
app.post('/regUser', async (req, res) => {
  const { userregname, userregrole, userregemail, userregpw, userregpn, userregcheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: userregemail });
  if (!existingUser) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newUserId;
    if (highestIdDoc) {
      const highestUserIdNumber = parseInt(highestIdDoc.User_ID.slice(3));
      newUserId = 'SF-' + (highestUserIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.User_ID = newUserId;
      await highestIdDoc.save();
    } else {
      newUserId = 'SF-1001';
      await HighestIdDocDT.create({ User_ID: newUserId });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userregpw, salt);
    const newUser = new UserDT({
      User_ID: newUserId,
      User_Role: userregrole,
      Name: userregname,
      Email: userregemail,
      Password: hashedPassword,
      Phone_No: userregpn,
      Max_Checkout_Limit: userregcheckoutlimit
    });
    const savedUser = await newUser.save();
    const newAccount = new AccountDT({
      No_of_Books_Borrowed: 0,
      No_of_Books_Returned: 0,
      No_of_Books_Reserved: 0,
      No_of_Books_Lost: 0,
      Total_Fine_Amount:  0,
      account_id: savedUser.User_ID
    });
    await newAccount.save();
    const data = await UserDT.find();
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'User successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/editUser', async (req, res) => {
  const { useridhidden, editusername, edituseremail, edituserpw, edituserpn, edituserrole, editusercheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: edituseremail });
  if (!existingUser || existingUser.User_ID.toString() === useridhidden) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(edituserpw, salt);
    await UserDT.findOneAndUpdate(
      { User_ID: useridhidden },
      {
        Name: editusername,
        Email: edituseremail,
        Password: hashedPassword,
        Phone_No: edituserpn,
        User_Role: edituserrole,
        Max_Checkout_Limit: editusercheckoutlimit
      }
    );
    const newLog = new ActivityLog({
      User_ID: useridhidden,
      action: 'User Edit',
      timestamp: new Date(),
      details: `User with ID ${useridhidden} was edited`
    });
    await newLog.save();
    const data = await UserDT.find();
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This User successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/delUser', async (req, res) => {
  const userids = JSON.parse(req.body.useridhidden);
  await UserDT.deleteMany({ User_ID: { $in: userids } });
  await AccountDT.deleteMany({ account_id: { $in: userids } });
  await FinesDT.deleteMany({ User_ID: { $in: userids } });
  await CheckoutDT.deleteMany({ Checkout_ID: { $in: userids } });
  await TransactionDT.deleteMany({ User_ID: { $in: userids } });
  await ReservationDT.deleteMany({ User_ID: { $in: userids } });
  for (let userid of userids) {
    const newLog = new ActivityLog({
      action: 'User Deletion',
      timestamp: new Date(),
      User_ID: userid,
      details: `User with ID ${userid} was deleted`
    });
    await newLog.save();
  }
  const data = await UserDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('usersTBL', { data, user });
});

// LIRARIAN
app.post('/regLibrarian', async (req, res) => {
  const { libregname, libregemail, libregpn, libregaddr } = req.body;
  let existingLibemail = await LibrarianDT.findOne({ Librarian_Email: libregemail });
  if (!existingLibemail) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newLibrarianId;
    if (highestIdDoc) {
      const highestLibrarianIdNumber = parseInt(highestIdDoc.Librarian_ID.slice(5));
      newLibrarianId = 'LB-ID' + (highestLibrarianIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Librarian_ID = newLibrarianId;
      await highestIdDoc.save();
    } else {
      newLibrarianId = 'LB-ID0001';
      await HighestIdDocDT.create({ Librarian_ID: newLibrarianId });
    }
    const newLibrarian = new LibrarianDT({
      Librarian_ID: newLibrarianId,
      Librarian_Name: libregname,
      Librarian_Email: libregemail,
      Phone_No: libregpn,
      Address: libregaddr
    });
    await newLibrarian.save();
    const data = await LibrarianDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('librarianTBL', { data,  user});
    return res.json({ success: true, message: 'Librarian successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingLibemail + ' is already exist' });
  }
});
app.post('/editLibrarian', async (req, res) => {
  const { libidhidden, editlibname, editlibemail, editlibpn, editlibaddr } = req.body;
  let existingLibemail = await LibrarianDT.findOne({ Librarian_Email: editlibemail });
  if (!existingLibemail || existingLibemail.Librarian_ID.toString() === libidhidden) {
    await LibrarianDT.findOneAndUpdate(
      { Librarian_ID: libidhidden },
      {
        Librarian_Email: editlibemail,
        Librarian_Name: editlibname,
        Phone_No: editlibpn,
        Address: editlibaddr
      }
    );
    const newLog = new ActivityLog({
      User_ID: libidhidden,
      action: 'Librarian Edit',
      timestamp: new Date(),
      details: `Librarian with ID ${libidhidden} was edited`
    });
    await newLog.save();
    const data = await LibrarianDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('librarianTBL', { data,  user});
    return res.json({ success: true, message: 'This Librarian successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingLibemail.Librarian_Email + ' is already exist' });
  }
});
app.post('/delLibrarian', async (req, res) => {
  const libids = JSON.parse(req.body.libidhidden);
  await LibrarianDT.deleteMany({ Librarian_ID: { $in: libids } });
  const data = await LibrarianDT.find();
  const user = await UserDT.findById(req.session.user);
  for (let libid of libids) {
    const newLog = new ActivityLog({
      action: 'Librarian Deletion',
      timestamp: new Date(),
      User_ID: libid,
      details: `Librarian with ID ${libid} was deleted`
    });
    await newLog.save();
  }
  res.render('librarianTBL', { data, user });
});

// STUDENT
app.post('/regStudent', async (req, res) => {
  const { userregname, userregemail, userregpw, userregpn, userregcheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: userregemail });
  if (!existingUser) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newUserId;
    if (highestIdDoc) {
      const highestUserIdNumber = parseInt(highestIdDoc.User_ID.slice(3));
      newUserId = 'SF-' + (highestUserIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.User_ID = newUserId;
      await highestIdDoc.save();
    } else {
      newUserId = 'SF-1001';
      await HighestIdDocDT.create({ User_ID: newUserId });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userregpw, salt);
    const newUser = new UserDT({
      User_ID: newUserId,
      User_Role: 'Student',
      Name: userregname,
      Email: userregemail,
      Password: hashedPassword,
      Phone_No: userregpn,
      Max_Checkout_Limit: userregcheckoutlimit
    });
    const savedUser = await newUser.save();
    const newAccount = new AccountDT({
      No_of_Books_Borrowed: 0,
      No_of_Books_Returned: 0,
      No_of_Books_Reserved: 0,
      No_of_Books_Lost: 0,
      Total_Fine_Amount:  0,
      account_id: savedUser.User_ID
    });
    await newAccount.save();
    const data = await UserDT.find({ User_Role: 'Student' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Student successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/editStudent', async (req, res) => {
  const { useridhidden, editusername, edituseremail, edituserpw, edituserpn, editusercheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: edituseremail });
  if (!existingUser || existingUser.User_ID.toString() === useridhidden) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(edituserpw, salt);
    await UserDT.findOneAndUpdate(
      { User_ID: useridhidden },
      {
        Name: editusername,
        Email: edituseremail,
        Password: hashedPassword,
        Phone_No: edituserpn,
        Max_Checkout_Limit: editusercheckoutlimit
      }
    );
    const newLog = new ActivityLog({
      User_ID: useridhidden,
      action: 'Student Edit',
      timestamp: new Date(),
      details: `Student with ID ${useridhidden} was edited`
    });
    await newLog.save();
    const data = await UserDT.find({ User_Role: 'Student' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Student successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/delStudent', async (req, res) => {
  const userids = JSON.parse(req.body.useridhidden);
  await UserDT.deleteMany({ User_ID: { $in: userids } });
  await AccountDT.deleteMany({ account_id: { $in: userids } });
  await FinesDT.deleteMany({ User_ID: { $in: userids } });
  await CheckoutDT.deleteMany({ Checkout_ID: { $in: userids } });
  await TransactionDT.deleteMany({ User_ID: { $in: userids } });
  await ReservationDT.deleteMany({ User_ID: { $in: userids } });
  for (let userid of userids) {
    const newLog = new ActivityLog({
      action: 'Student Deletion',
      timestamp: new Date(),
      User_ID: userid,
      details: `Student with ID ${userid} was deleted`
    });
    await newLog.save();
  }
  const data = await UserDT.find({ User_Role: 'Student' });
  const user = await UserDT.findById(req.session.user);
  res.render('studentsTBL', { data, user });
});

// TEACHER
app.post('/regTeacher', async (req, res) => {
  const { userregname, userregemail, userregpw, userregpn, userregcheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: userregemail });
  if (!existingUser) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newUserId;
    if (highestIdDoc) {
      const highestUserIdNumber = parseInt(highestIdDoc.User_ID.slice(3));
      newUserId = 'SF-' + (highestUserIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.User_ID = newUserId;
      await highestIdDoc.save();
    } else {
      newUserId = 'SF-1001';
      await HighestIdDocDT.create({ User_ID: newUserId });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userregpw, salt);
    const newUser = new UserDT({
      User_ID: newUserId,
      User_Role: 'Teacher',
      Name: userregname,
      Email: userregemail,
      Password: hashedPassword,
      Phone_No: userregpn,
      Max_Checkout_Limit: userregcheckoutlimit
    });
    const savedUser = await newUser.save();
    const newAccount = new AccountDT({
      No_of_Books_Borrowed: 0,
      No_of_Books_Returned: 0,
      No_of_Books_Reserved: 0,
      No_of_Books_Lost: 0,
      Total_Fine_Amount:  0,
      account_id: savedUser.User_ID
    });
    await newAccount.save();
    const data = await UserDT.find({ User_Role: 'Teacher' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Teacher successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/editTeacher', async (req, res) => {
  const { useridhidden, editusername, edituseremail, edituserpw, edituserpn, editusercheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: edituseremail });
  if (!existingUser || existingUser.User_ID.toString() === useridhidden) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(edituserpw, salt);
    await UserDT.findOneAndUpdate(
      { User_ID: useridhidden },
      {
        Name: editusername,
        Email: edituseremail,
        Password: hashedPassword,
        Phone_No: edituserpn,
        Max_Checkout_Limit: editusercheckoutlimit
      }
    );
    const newLog = new ActivityLog({
      User_ID: useridhidden,
      action: 'Teacher Edit',
      timestamp: new Date(),
      details: `Teacher with ID ${useridhidden} was edited`
    });
    await newLog.save();
    const data = await UserDT.find({ User_Role: 'Teacher' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Teacher successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/delTeacher', async (req, res) => {
  const userids = JSON.parse(req.body.useridhidden);
  await UserDT.deleteMany({ User_ID: { $in: userids } });
  await AccountDT.deleteMany({ account_id: { $in: userids } });
  await FinesDT.deleteMany({ User_ID: { $in: userids } });
  await CheckoutDT.deleteMany({ Checkout_ID: { $in: userids } });
  await TransactionDT.deleteMany({ User_ID: { $in: userids } });
  await ReservationDT.deleteMany({ User_ID: { $in: userids } });
  for (let userid of userids) {
    const newLog = new ActivityLog({
      action: 'Teacher Deletion',
      timestamp: new Date(),
      User_ID: userid,
      details: `Teacher with ID ${userid} was deleted`
    });
    await newLog.save();
  }
  const data = await UserDT.find({ User_Role: 'Teacher' });
  const user = await UserDT.findById(req.session.user);
  res.render('teachersTBL', { data, user });
});

// STAFF
app.post('/regStaff', async (req, res) => {
  const { userregname, userregemail, userregpw, userregpn, userregcheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: userregemail });
  if (!existingUser) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newUserId;
    if (highestIdDoc) {
      const highestUserIdNumber = parseInt(highestIdDoc.User_ID.slice(3));
      newUserId = 'SF-' + (highestUserIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.User_ID = newUserId;
      await highestIdDoc.save();
    } else {
      newUserId = 'SF-1001';
      await HighestIdDocDT.create({ User_ID: newUserId });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userregpw, salt);
    const newUser = new UserDT({
      User_ID: newUserId,
      User_Role: 'Staff',
      Name: userregname,
      Email: userregemail,
      Password: hashedPassword,
      Phone_No: userregpn,
      Max_Checkout_Limit: userregcheckoutlimit
    });
    const savedUser = await newUser.save();
    const newAccount = new AccountDT({
      No_of_Books_Borrowed: 0,
      No_of_Books_Returned: 0,
      No_of_Books_Reserved: 0,
      No_of_Books_Lost: 0,
      Total_Fine_Amount:  0,
      account_id: savedUser.User_ID
    });
    await newAccount.save();
    const data = await UserDT.find({ User_Role: 'Staff' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Staff successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/editStaff', async (req, res) => {
  const { useridhidden, editusername, edituseremail, edituserpw, edituserpn, editusercheckoutlimit } = req.body;
  let existingUser = await UserDT.findOne({ Email: edituseremail });
  if (!existingUser || existingUser.User_ID.toString() === useridhidden) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(edituserpw, salt);
    await UserDT.findOneAndUpdate(
      { User_ID: useridhidden },
      {
        Name: editusername,
        Email: edituseremail,
        Password: hashedPassword,
        Phone_No: edituserpn,
        Max_Checkout_Limit: editusercheckoutlimit
      }
    );
    const newLog = new ActivityLog({
      User_ID: useridhidden,
      action: 'Staff Edit',
      timestamp: new Date(),
      details: `Staff with ID ${useridhidden} was edited`
    });
    await newLog.save();
    const data = await UserDT.find({ User_Role: 'Staff' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Staff successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Email: ' + existingUser.Email + ' is already exist' });
  }
});
app.post('/delStaff', async (req, res) => {
  const userids = JSON.parse(req.body.useridhidden);
  await UserDT.deleteMany({ User_ID: { $in: userids } });
  await AccountDT.deleteMany({ account_id: { $in: userids } });
  await FinesDT.deleteMany({ User_ID: { $in: userids } });
  await CheckoutDT.deleteMany({ Checkout_ID: { $in: userids } });
  await TransactionDT.deleteMany({ User_ID: { $in: userids } });
  await ReservationDT.deleteMany({ User_ID: { $in: userids } });
  for (let userid of userids) {
    const newLog = new ActivityLog({
      action: 'Staff Deletion',
      timestamp: new Date(),
      User_ID:  userid,
      details: `Staff with ID ${ userid} was deleted`
    });
    await newLog.save();
  }
  const data = await UserDT.find({ User_Role: 'Staff' });
  const user = await UserDT.findById(req.session.user);
  res.render('staffTBL', { data, user });
});

// BOOK
app.post('/regBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookregcategory, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: bookregcategory,
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('booksTBL', { data, user });
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbookcategory, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Category_ID: editbookcategory,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
       User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('booksTBL', { data,  user});
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden); // assuming bookidhidden is an array of book ids
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('booksTBL', { data, user });
});

// AUTHOR
app.post('/regAuthor', async (req, res) => {
  const { authorregname } = req.body;
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: authorregname });
  if (!existingAuthor) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newAuthorId;
    if (highestIdDoc) {
      const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
      newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Author_ID = newAuthorId;
      await highestIdDoc.save();
    } else {
      newAuthorId = 'A-1001';
      await HighestIdDocDT.create({ Author_ID: newAuthorId });
    }
    const newAuthor = new AuthorsDT({
      Author_ID: newAuthorId,
      Author_Name: authorregname
    });
    await newAuthor.save();
    const data = await AuthorsDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('authorsTBL', { data,  user });
    return res.json({ success: true, message: 'Author successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Author: ' + existingAuthor.Author_Name + ' is already exist' });
  }
});
app.post('/editAuthor', async (req, res) => {
  const { authoridhidden, editauthorname } = req.body;
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: editauthorname });
  if (!existingAuthor || existingAuthor.Author_ID.toString() === authoridhidden) {
    await AuthorsDT.findOneAndUpdate(
      { Author_ID: authoridhidden },
      {
        Author_Name: editauthorname
      }
    );
    const newLog = new ActivityLog({
       User_ID: authoridhidden,
      action: 'Author Edit',
      timestamp: new Date(),
      details: `Author with ID ${authoridhidden} was edited`
    });
    await newLog.save();
    const data = await AuthorsDT.find();
    const user = await UserDT.findById(req.session.user);
    // res.render('authorsTBL', { data,  user});
    return res.json({ success: true, message: 'This Author successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Author: ' + existingAuthor.Author_Name + ' is already exist' });
  }
});
app.post('/delAuthor', async (req, res) => {
  const authorids = JSON.parse(req.body.authoridhidden);
  await AuthorsDT.deleteMany({ Author_ID: { $in: authorids } });
  for (let authorid of authorids) {
    const newLog = new ActivityLog({
      action: 'Author Deletion',
      timestamp: new Date(),
       User_ID: authorid,
      details: `Author with ID ${authorid} was deleted`
    });
    await newLog.save();
  }
  const data = await AuthorsDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('authorsTBL', { data, user });
});

// app.use(async (req, res, next) => {
//   const send = res.send;
//   res.send = function (body) {
//     if (res.statusCode === 400) {
//       return send.call(this, JSON.stringify({ success: false, message: body }));
//     }
//     return send.call(this, body);
//   };
//   next();
// });

// PUBLISHER
app.post('/regPublisher', async (req, res) => {
  const { pubregname, pubregaddr, pubregemail } = req.body;
  let existingPublisher = await PublishersDT.findOne({ Publisher_Contact_Info: pubregemail });
  if (!existingPublisher) {
    const highestIdDoc = await HighestIdDocDT.findOne();
    let newPublisherId;
    if (highestIdDoc) {
      const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
      newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Publisher_ID = newPublisherId;
      await highestIdDoc.save();
    } else {
      newPublisherId = 'PID-0001';
      await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
    }
    const newPublisher = new PublishersDT({
      Publisher_ID: newPublisherId,
      Publisher_Name: pubregname,
      Publisher_Address: pubregaddr,
      Publisher_Contact_Info: pubregemail
    });
    await newPublisher.save();
    const data = await PublishersDT.find();
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Publisher successfully registered', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Publisher: ' + existingPublisher.Publisher_Name + ' is already exist' });
  }
});
app.post('/editPublisher', async (req, res) => {
  const { pubidhidden, editpubname, editpubaddr, editpubemail } = req.body;
  let existingPublisher = await PublishersDT.findOne({ Publisher_Contact_Info: editpubemail });
  if (!existingPublisher || existingPublisher.Publisher_ID.toString() === pubidhidden) {
    await PublishersDT.findOneAndUpdate(
      { Publisher_ID: pubidhidden },
      {
        Publisher_Name: editpubname,
        Publisher_Address: editpubaddr,
        Publisher_Contact_Info: editpubemail
      }
    );
    const newLog = new ActivityLog({
       User_ID: pubidhidden,
      action: 'Publisher Edit',
      timestamp: new Date(),
      details: `Publisher with ID ${pubidhidden} was edited`
    });
    await newLog.save();
    const data = await PublishersDT.find();
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Publisher successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Publisher: ' + existingPublisher.Publisher_Contact_Info + ' is already exist' });
  }
});
app.post('/delPublisher', async (req, res) => {
  const pubids = JSON.parse(req.body.pubidhidden);
  await PublishersDT.deleteMany({ Publisher_ID: { $in: pubids } });
  for (let pubid of pubids) {
    const newLog = new ActivityLog({
      action: 'Publisher Deletion',
      timestamp: new Date(),
       User_ID: pubid,
      details: `Book with ID ${pubid} was deleted`
    });
    await newLog.save();
  }
  const data = await PublishersDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('publisherTBL', { data, user });
});

// FINE DELETION
app.post('/delFine', async (req, res) => {
  const fineids = JSON.parse(req.body.fineidhidden);
  await FinesDT.deleteMany({ Fine_ID: { $in: fineids } });
  const data = await FinesDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('fineTBL', { data, user });
});

// CHECKOUT DELETION
app.post('/delCheckout', async (req, res) => {
  const checkoutids = JSON.parse(req.body.checkoutidhidden);
  await CheckoutDT.deleteMany({ Fine_ID: { $in: checkoutids } });
  const data = await CheckoutDT.find();
  const user = await UserDT.findById(req.session.user);
  res.render('checkoutTBL', { data, user });
});

// FICTION
app.post('/regFictionBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0001',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0001' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editFictionBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
       User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0001' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delFictionBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0001' });
  const user = await UserDT.findById(req.session.user);
  res.render('fictionTBL', { data, user });
});

// MYSTERY
app.post('/regMysteryBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0002',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0002' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editMysteryBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0002' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delMysteryBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0002' });
  const user = await UserDT.findById(req.session.user);
  res.render('mysteryTBL', { data, user });
});

// ROMANCE
app.post('/regRomanceBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0003',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0003' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editRomanceBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0003' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delRomanceBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0003' });
  const user = await UserDT.findById(req.session.user);
  res.render('romanceTBL', { data, user });
});

// SCIENCE FICTION
app.post('/regSciFiBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0004',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0004' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editSciFiBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0004' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delSciFiBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0004' });
  const user = await UserDT.findById(req.session.user);
  res.render('scifiTBL', { data, user });
});

// FANTASY
app.post('/regFantasyBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0005',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0005' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editFantasyBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0005' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delFantasyBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0005' });
  const user = await UserDT.findById(req.session.user);
  res.render('fantasyTBL', { data, user });
});

// THRILLER
app.post('/regThrillerBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0006',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0006' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editThrillerBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0006' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delThrillerBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
       User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0006' });
  const user = await UserDT.findById(req.session.user);
  res.render('thrillerTBL', { data, user });
});

// BIOGRAPHY
app.post('/regBiographyBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0007',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0007' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editBiographyBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0007' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delBiographyBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
      User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0007' });
  const user = await UserDT.findById(req.session.user);
  res.render('biographyTBL', { data, user });
});

// HORROR
app.post('/regHorrorBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0008',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0008' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editHorrorBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0008' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delHorrorBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
      User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0008' });
  const user = await UserDT.findById(req.session.user);
  res.render('horrorTBL', { data, user });
});

// HISTORY
app.post('/regHistoryBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0009',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0009' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editHistoryBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0009' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delHistoryBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
      User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0009' });
  const user = await UserDT.findById(req.session.user);
  res.render('historyTBL', { data, user });
});

// NOVEL
app.post('/regNovelBook', async (req, res) => {
  const { bookregtitle, bookregauthor, bookregpublisher, bookreglanguage, bookregcopies, bookregstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: bookregtitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_Name: bookregauthor });
  let existingPublisher = await PublishersDT.findOne({ Publisher_Name: bookregpublisher });
  const highestIdDoc = await HighestIdDocDT.findOne();
  let newBookId, newAuthorId, newPublisherId;
  if (existingBook && existingAuthor || existingPublisher) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name  + ' is already exist' });
  }else {
    if (!existingAuthor) {
      if (highestIdDoc) {
        const highestAuthorIdNumber = parseInt(highestIdDoc.Author_ID.slice(2));
        newAuthorId = 'A-' + (highestAuthorIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Author_ID = newAuthorId;
        await highestIdDoc.save();
      } else {
        newAuthorId = 'A-1001';
        await HighestIdDocDT.create({ Author_ID: newAuthorId });
      }
      const newAuthor = new AuthorsDT({
        Author_ID: newAuthorId,
        Author_Name: bookregauthor
      });
      existingAuthor = await newAuthor.save();
    }
    if (!existingPublisher) {
      if (highestIdDoc) {
        const highestPublisherIdNumber = parseInt(highestIdDoc.Publisher_ID.slice(4));
        newPublisherId = 'PID-' + (highestPublisherIdNumber + 1).toString().padStart(4, '0');
        highestIdDoc.Publisher_ID = newPublisherId;
        await highestIdDoc.save();
      } else {
        newPublisherId = 'PID-0001';
        await HighestIdDocDT.create({ Publisher_ID: newPublisherId });
      }
      const newPublisher = new PublishersDT({
        Publisher_ID: newPublisherId,
        Publisher_Name: bookregpublisher,
        Publisher_Address: "",
        Publisher_Contact_Info: ""
      });
      existingPublisher = await newPublisher.save();
    }
    if (highestIdDoc) {
      const highestBookIdNumber = parseInt(highestIdDoc.Book_id.slice(3));
      newBookId = 'BK-' + (highestBookIdNumber + 1).toString().padStart(4, '0');
      highestIdDoc.Book_id = newBookId;
      await highestIdDoc.save();
    } else {
      newBookId = 'BK-0001';
      await HighestIdDocDT.create({ Book_id: newBookId });
    }
    const newBook = new BooksDT({
      Book_id: newBookId,
      Title: bookregtitle,
      Author_ID: existingAuthor.Author_ID,
      Publisher_ID: existingPublisher.Publisher_ID,
      Category_ID: 'CT-0010',
      Language: bookreglanguage,
      Copies_Available: bookregcopies,
      Book_Status: bookregstatus
    });
    await newBook.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0010' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'Book successfully registered', data, user });
  }
});
app.post('/editNovelBook', async (req, res) => {
  const { bookidhidden, autidhidden, pubidhidden, editbooktitle, editbooklanguage, editbookcopies, editbookstatus } = req.body;
  let existingBook = await BooksDT.findOne({ Title: editbooktitle });
  let existingAuthor = await AuthorsDT.findOne({ Author_ID: autidhidden });
  let existingPublisher = await PublishersDT.findOne({ Publisher_ID: pubidhidden });
  if (existingBook && existingAuthor) {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingAuthor.Author_Name + ' is already exist' });
  }else if (!existingBook || existingBook.Book_id.toString() === bookidhidden) {
    await BooksDT.findOneAndUpdate(
      { Book_id: bookidhidden },
      {
        Title: editbooktitle,
        Language: editbooklanguage,
        Copies_Available: editbookcopies,
        Book_Status: editbookstatus
      }
    );
    const newLog = new ActivityLog({
      User_ID: bookidhidden,
      action: 'Book Edit',
      timestamp: new Date(),
      details: `Book with ID ${bookidhidden} was edited`
    });
    await newLog.save();
    const data = await BooksDT.find({ Category_ID: 'CT-0010' });
    const user = await UserDT.findById(req.session.user);
    return res.json({ success: true, message: 'This Book successfully edited', data, user });
  }else {
    return res.status(400).json({ success: false, message: 'This Book: ' + existingBook.Title + ' By ' + existingPublisher.Publisher_Name  + ' is already exist' });
  }
});
app.post('/delNovelBook', async (req, res) => {
  const bookids = JSON.parse(req.body.bookidhidden);
  await BooksDT.deleteMany({ Book_id: { $in: bookids } });
  await ReservationDT.deleteMany({ Book_ID: { $in: bookids } });
  for (let bookid of bookids) {
    const newLog = new ActivityLog({
      action: 'Book Deletion',
      timestamp: new Date(),
      User_ID: bookid,
      details: `Book with ID ${bookid} was deleted`
    });
    await newLog.save();
  }
  const data = await BooksDT.find({ Category_ID: 'CT-0010' });
  const user = await UserDT.findById(req.session.user);
  res.render('novelTBL', { data, user });
});

// ACTIVITY LOG DELETION
app.post('/delLogs', async (req, res) => {
  const logsids = JSON.parse(req.body.logidhidden);
  await ActivityLog.deleteMany({ _id: { $in: logsids } });
  const data = await ActivityLog.find();
  const user = await UserDT.findById(req.session.user);
  res.render('activitylogsTBL', { data, user });
});

// LOG-OUT
app.get('/logout', async (req, res) => {
  const user = await UserDT.findById(req.session.user);
  if (user) {
    const newLog = new ActivityLog({
      action: 'User Logout',
      timestamp: new Date(),
      User_ID: user.User_ID,
      details: "User with ID "+ user.User_ID + " logged out"
    });
    await newLog.save();
  }
  req.session.destroy();
  res.render('veritas');
});

app.listen(port, () => console.log(`Server started on port ${port}`));
