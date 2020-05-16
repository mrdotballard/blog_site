CREATE DATABASE myblog;

USE myblog;


    /*** CREATE TABLES***/
    -- USER
CREATE TABLE IF NOT EXISTS user(
    user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100),
    password VARCHAR(100),
    first_name VARCHAR (100),
    last_name VARCHAR (100),
    email VARCHAR(100)
);

DESCRIBE user;

  -- BLOG
CREATE TABLE IF NOT EXISTS blog(
  blog_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  image VARCHAR(100), -- store file name or location
  title VARCHAR(100),
  intro TEXT,
  content TEXT,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);

DESCRIBE blog;


-- TAG
CREATE TABLE IF NOT EXISTS tag(
  tag_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  color VARCHAR(7) -- hex color
);

DESCRIBE tag;


-- M:N RELATION TABLE
CREATE TABLE IF NOT EXISTS blog_tag(
  blog_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (blog_id, tag_id)
);

DESCRIBE blog_tag;