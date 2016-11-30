# iDB

iDB is a promises based SQL-like abstraction library for indexedDB, made using the builder design pattern.

Using this library, you can build, manage and query databases in indexedDB without needing to worry about the intricacies of indexedDB, such as opening and closing transactions, while providing a way to directly write more complex queries for retrieving data. 

Designing with SQL in mind, this library's usage should feel easier and more familiar to use, especially to people with some knowledge of SQL. A basic knowledge of indexedDB is still useful, when creating tables, but not required.

---

Most functions return iDB, allowing you to chain up functions, like:
``` javascript
iDB.newTable("testTable").addColumns("column1", "column2").setDatabase("testDatabase")
```

### Database set-up and maintenance functions

\* = optional

| Function        | Explanation           | Parameters  | Returns |
| ------------- |:-------------:| :-----:|:-------: |
| createTable      | Start the configuration for a new table |**String** table name, **Object*** options  | iDB |
| addColumn      |   Add a single column to the new table. Use when extra options are to be provided.     | **String** column name **Object*** options  | iDB |
| addColumns | When column names are all you have, you can use this to add multiple columns in one go      | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |
| setDatabase | Use at the end of the table creation chain. Takes data for all new tables and creates a new version of the database. An incrementally higher version is needed if updating an existing database of the same name.  | **String** database name **Integer*** version | Promise | 
|dropDatabase| Drop an existing database from storage |**String** Database name  | Promise |
| use | Select the database to use. This is not reset after queries, so setting it once should be enough, in most cases. | **String** database name | iDB |
NOTE: Drop table is not implemented because in indexedDB, the only wayy to update a database's tables is to create a new version of the database, with the new structure.

### Queries
| Function | Explanation | Parameters | Returns |
| ------------- |:-------------:| :-----:|:-------: |
| run | This function needs to be called at the end of the query building chain. It also clears the built up data (but not the database used) | | Promise |
| select | Data to select. Leaving this empty will select all data | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |
| from | Specify the table to use for queries | **String** table name | iDB |
| where | Specify a list of conditions for the query. The conditions are just functions that take at least one parameter and returns a boolean value | Any number of **function** parameters, **function arrays** and any combination of the two | iDB |
| insert | Insert some data into a table in the database. How this works depends on your table structure. | Any, depending on how the table is set up (eg, maybe an object like {column1: value1}, but tables can be set up to allow just simple stings, numbers, or even arrays)  | iDB |
| into | Specify table to insert data into | **String** table name | iDB |
| values | Optional function for people who prefer the more SQL-like look. Goes together with insert, taking insert()'s parameters instead. | see above | iDB |
| limit | Limit the number of results for the cursor to query | **Integer** The positive integer value of the maximum data size | iDB |
| skip | Skip results from the start of the query | **Integer** Positive integer value of the number of results to skip | iDB |
| reverse | Use to query the table starting from the bottom | | iDB |
| distinct | Use to query only results that are not duplicate | | iDB |
| delete | Use this to delete data from a table | | iDB |
| update | Use this to update data in a table | **String** table name | iDB |
| set | Use together with update() to update records with this value | **Object** a key:value object (representing column:value), matching your table structure, where the columns in the table will be updated with the new values | iDB |
| orderBy | Determine the order of records with list of column names | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |


#### You can see these two tables in the console by using ``` iDB.help()```
