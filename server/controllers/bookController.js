//NEED MODEL
const db = require('../models/starWarsModels');

const bookController = {};

bookController.getAllBooks = (req, req, next) => {
  const mySQL = 'SELECT b._id AS ID, b_name as Title from books';
  db.query(mySQL).then((data) => {
    res.locals.allBooks = data.rows;
    return next();
  });
};

//query to get a list of the users books
bookController.getUserBooks = (req, res, next) => {
  // write code here
  //Should have this for either when someone logs in or when someone enters a new entry
  const id = Object.values(res.locals.user._id);

  //this should get all the entries of books where c.book_id = b._ID and u._id = c.user_ID when u._id = entry
  const mySQL =
    //this should get all the books without genre
    'SELECT * FROM books b INNER JOIN catalog c on c.book_id = b._id INNER JOIN users u on u._id = c.user_id WHERE u._id = $1';
  //This might work to get the genre as well as the book id?
  const mySQL2 =
    'SELECT b.title, b.author, g.genre AS genre FROM books b INNER JOIN catalog c on c.book_id = b._id INNER JOIN genre g on g._id = b.genre INNER JOIN users u on u._id = c.user_id WHERE u._id = $1';
  // const diffSQL = 'SELECT p.name AS Character, s.name FROM public.people p LEFT OUTER JOIN public.species s ON p.species_id = s._id';
  db.query(mySQL, id)
    .then((data) => {
      res.locals.userBooks = data.rows;
      return next();
    })
    //this will be front end work if there is nothing found, just have an empty array
    .catch((err) => {
      return next({
        log: `Error in getUserBooks: ${err}`,
        status: 400,
        message: {
          err: 'An error occurred. Check server logs for more details',
        },
      });
    });
};

bookController.findBook = (req, res, next) => {
  res.locals.bookData = Object.values(req.body);
  //[title, author, genre]
  const id = res.locals.bookData;
  //should I make it case insensitive?
  const mySQL = 'SELECT * FROM books b WHERE b._name = $1 AND b._author = $2';

  db.query(mySQL, id)
    .then((data) => {
      res.locals.foundBook = true;
      res.locals.bookEntry = data.rows[0];
      return next();
    })
    .catch((err) => {
      return next();
    });
};

bookController.findGenre = (req, res, next) => {
  //I'm expecting userID to be in the reqBody for catalog purposes.
  //[title, author, genre, user_id]
  if (res.locals.foundBook) {
    return next();
  }
  const id = res.locals.bookData;
  const mySQL = 'SELECT g._id FROM genre g WHERE g.genre = $3';
  db.query(mySQL, id)
    .then((data) => {
      res.locals.genre_id = data.rows[0]._id;
      return next();
    })
    .catch((err) => {
      return next({
        log: `Error in findGenre: ${err}`,
        status: 400,
        message: {
          err: 'An error occurred. Check server logs for more details',
        },
      });
    });
};

bookController.createBook = (req, res, next) => {
  if (res.locals.foundBook) {
    return next();
  }
  //[title, author, genre, user_id, genre_id]
  const id = [...res.locals.bookData, res.locals.genre_id];

  //should be 1, 2, 5 as that should be title, genre, and genre_id
  //Should output book ID
  const mySQL =
    'INSERT INTO books (name, author, genre) OUTPUT Inserted._id VALUES ($1, $2, $5)';

  db.query(mySQL, id)
    .then((data) => {
      //I believe insert returns an item?
      res.locals.bookEntry = data.rows[0];
      return next();
    })
    .catch((err) => {
      return next({
        log: `Error in createBooks: ${err}`,
        status: 400,
        message: {
          err: 'An error occurred. Check server logs for more details',
        },
      });
    });
};

//We need user_id for this
bookController.createCatalogEntry = (req, res, next) => {
  const id = [...res.locals.bookData, res.locals.bookEntry._id];
  //[title, author, genre, user_id, book_id]
  const mySQL =
    'INSERT INTO catalog c (user_id, book_id) OUTPUT Inserted.user_id VALUES ($4, $5)';
  db.query(mySQL, id)
    .then((data) => {
      res.locals.user = data.rows[0];
      return next();
    })
    .catch((err) => {
      return next({
        log: `Error in createCatalogEntry: ${err}`,
        status: 400,
        message: {
          err: 'An error occurred. Check server logs for more details',
        },
      });
    });
};

module.exports = bookController;