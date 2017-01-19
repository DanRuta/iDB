# iDB

iDB is a promises based SQL-like abstraction library for indexedDB, made using the builder design pattern.

Using this library, you can build, manage and query databases in indexedDB without needing to worry about the intricacies of indexedDB, such as opening and closing transactions, while providing a way to directly write more complex queries for retrieving data. 

Designing with SQL in mind, this library's usage should feel easier and more familiar to use, especially to people with some knowledge of SQL. A basic knowledge of indexedDB is still useful, when creating tables, but not required.

Most functions return iDB, allowing you to chain up functions, like:
``` javascript
iDB.newTable("testTable")
   .addColumns("column1", "column2")
   .setDatabase("testDatabase")
```
---
# Examples
You can follow the below examples in your console, in order, for a quick walkthrough of the main features of this library. You can see the data in devtools, under the Application tab. 

Scroll down further to see tables detailing each function and the parameters they take.

### Creating your first database and table
To create a new database, you first build up a chain of tables, and set the database name, at the end.
```javascript
iDB.createTable("chatMessages", {autoIncrement: true}).addColumns("messageText", "messageAuthor")
   .createTable("someOtherStuff").addColumn("aColumn", {unique: true})
   .setDatabase("chatDB")
```
### Updating a table/database
When updating a table or database's structure, you must call the same functions, ending with setDatabase(), and give it an incrementally higher database version.
```javascript
iDB.createTable("chatMessages", {autoIncrement: true})
   .addColumns("messageText", "messageTopic", "messageAuthor", "messageDate")
   .setDatabase("chatDB", 2)
```
### INSERT records
Let's set up some records to play with.
```javascript
iDB.use("chatDB")

iDB.insert({messageTopic: "Testing Stuff",  messageText: "Hello world", messageAuthor: "some guy", messageDate: new Date().toJSON()}).into("chatMessages").run()

iDB.insert({messageTopic: "Testing Stuff",  messageText: "Hello again world", messageAuthor: "some guy", messageDate: new Date().toJSON()}).into("chatMessages").run()

iDB.insert({messageTopic: "Testing Stuff",  messageText: "Hello back", messageAuthor: "some other guy", messageDate: new Date().toJSON()}).into("chatMessages").run()

iDB.insert({messageTopic: "Other Stuff",  messageText: "Some other stuff", messageAuthor: "some guy", messageDate: new Date().toJSON()}).into("chatMessages").run()
```
You can also insert data using values(), if preferred.
```javascript
iDB.insert().into("chatMessages").values({messageTopic: "Other Stuff",  messageText: "Some more stuff", messageAuthor: "some guy", messageDate: new Date().toJSON()}).run()
```
You may have to refresh the page to see the data in devtools.
### SELECT records
Don't forget to specify which database to use, if you need to.
```javascript
iDB.use("chatDB")
```
You can select all data by not giving select() any parameters.
```javascript
iDB.select().from("chatMessages").run().then(console.log)
```
You should now see a list of all the records. You can also give select() some column names, to only get some data.
```javascript
iDB.select("messageText").from("chatMessages").run().then(console.log)
```
You should now see something like
```javascript
[
    {
        "messageText": "Hello world"
    },
    {
        "messageText": "Hello again world"
    },
    {
        "messageText": "Hello back"
    },
    {
        "messageText": "Some other stuff"
    },
    {
        "messageText": "Some more stuff"
    }
]
```
### WHERE conditions
Conditions are just normal javascript functions. They must return a boolean value (true for 'use this record', false for 'ignore this record').
```javascript
iDB.select()
   .from("chatMessages")
   .where(x => x.messageAuthor=="some guy")
   .run().then(console.log)
```
This should return 4 records, all from the author: "some guy". You can add more conditions to be AND-ed together, if you need to. (Seeing as normal functions are used, you can usually just define most of your logic inside one function, especially for more complex conditions)
```javascript
iDB.select()
   .from("chatMessages")
   .where(x => x.messageAuthor=="some guy", x => x.messageTopic=="Testing Stuff")
   .run().then(console.log)
```
This should return 2 records, from the author "some guy" and with the topic "Testing Stuff"
### LIMIT records
```javascript
iDB.select("messageText").from("chatMessages").limit(3).run().then(console.log)
```
### SKIP records
```javascript
iDB.select("messageText").from("chatMessages").skip(2).run().then(console.log)
```
### UPDATE records
```javascript
iDB.update("chatMessages")
   .set({messageText: "Hello back world"})
   .where(x => x.messageText=="Hello back")
   .run().then(console.log)
```
This shoould return "1", representing the number of records that were updated. If you refresh, the record now has "Hello back world" as its "messageText" value.
### ORDER records
Don't forget to specify the database name, if you refreshed the page.
```javascript
iDB.use("chatDB")
```
With this, the records with the topic "Other Stuff" should appear first.
```javascript
iDB.select("messageText", "messageTopic")
   .from("chatMessages")
   .orderBy("messageTopic")
   .run().then(console.log)
```
And with this, the records with the topic "Other Stuff" should appear first, and the messages' text should be ordered alphabetically, too, where the message topics are the same.
```javascript
iDB.select("messageTopic", "messageText")
   .from("chatMessages")
   .orderBy("messageTopic", "messageText")
   .run().then(console.log)
```
### GROUP records
Grouping returns objects (therefore it doesn't make sense to use orderBy together with it). The following should return an object with two keys, "Other Stuff" and "Testing Stuff" (the "messageTopic" column's values), both containing arrays of records.
```javascript
iDB.select()
   .from("chatMessages")
   .groupBy("messageTopic")
   .run().then(console.log)
```
Like orderBy, you can give more parameters to group by another level. 
```javascript
iDB.select(["messageTopic", "messageText", "messageDate"])
   .from("chatMessages")
   .groupBy("messageTopic", "messageText")
   .run().then(console.log)
```
This should return the same, but instead of arrays, there are now objects with the "messageText" column's values as keys. Something like this: 
```javascript
{
    "Testing Stuff": {
        "Hello world": [
            {
                "messageDate": "2016-12-06T19:09:10.862Z"
            }
        ],
        "Hello again world": [
            {
                "messageDate": "2016-12-06T19:09:15.470Z"
            }
        ],
        "Hello back world": [
            {
                "messageDate": "2016-12-06T19:09:18.758Z"
            }
        ]
    },
    "Other Stuff": {
        "Some other stuff": [
            {
                "messageDate": "2016-12-06T19:09:26.765Z"
            }
        ],
        "Some more stuff": [
            {
                "messageDate": "2016-12-06T19:09:31.391Z"
            }
        ]
    }
}
```
### FUNCTIONS
Scalar functions are applied to each record, individually.
```javascript
iDB.select()
   .from("chatMessages")
   .functions({column: "messageText", scalar: x => x.toUpperCase()})
   .groupBy("messageTopic").run().then(console.log)
```
Aggregate functions are applied to column values as they are folded onto each other into one value, one by one starting at the top of the list.
```javascript
iDB.select()
   .from("chatMessages")
   .functions({column: "messageText", scalar: x => x.toUpperCase()}, {column: "messageTopic", aggregate: (x,y) => x+y})
   .groupBy("messageTopic")
   .run().then(console.log)
```
This should return something like:
```javascript
{
    "Testing StuffTesting StuffTesting StuffOther StuffOther Stuff": [
        {
            "messageText": "HELLO WORLD",
            "messageAuthor": "some guy",
            "messageDate": "2016-12-05T20:31:59.810Z"
        },
        {
            "messageText": "HELLO AGAIN WORLD",
            "messageAuthor": "some guy",
            "messageDate": "2016-12-05T20:32:04.426Z"
        },
        {
            "messageText": "HELLO BACK WORLD",
            "messageAuthor": "some other guy",
            "messageDate": "2016-12-05T20:32:10.499Z"
        },
        {
            "messageText": "SOME OTHER STUFF",
            "messageAuthor": "some guy",
            "messageDate": "2016-12-05T20:32:13.546Z"
        },
        {
            "messageText": "SOME MORE STUFF",
            "messageAuthor": "some guy",
            "messageDate": "2016-12-05T20:32:20.893Z"
        }
    ]
}
```
Here, the message topic values have been run through the aggregate function which, in this example, just appended the strings together. You may want to do something more useful with this, like adding numbers together.
### DELETE records
Like in SQL, you can use delete() to remove records from a table, completely. To remove just one field in a record, you would use update() and give the field a null value. 
Be careful with this function. If you forget to add a where() condition, all data will get deleted.  
```javascript
iDB.delete()
   .from("chatMessages")
   .where(x => x.messageAuthor=="some other guy")
   .run().then(console.log)
```
### DROP a database
```javascript
iDB.dropDatabase("chatDB")
```
Nice and easy.

---
# API
### Database set-up and maintenance functions

\* = optional

| Function        | Explanation           | Parameters  | Returns |
| ------------- |:-------------:| :-----:|:-------: |
| createTable      | Start the configuration for a new table |**String** table name, **Object*** options  | iDB |
| addColumn      |   Add a single column to the new table. Use when extra options are to be provided. The table keypath is set in the options object. If none is provided, it will be set to the column name    | **String** column name **Object*** options  | iDB |
| addColumns | When column names are all you have, you can use this to add multiple columns in one go      | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |
| setDatabase | Use at the end of the table creation chain. Takes data for all new tables and creates a new version of the database. An incrementally higher version is needed if updating an existing database of the same name.  | **String** database name **Integer*** version | Promise | 
|dropDatabase| Drop an existing database from storage |**String** Database name  | Promise |
| use | Select the database to use. This is not reset after queries, so setting it once should be enough, in most cases. | **String** database name | iDB |
| exists | Check if a specific database exists | **String** database name | Promise (resolving a boolean) |
NOTE: Drop table is not implemented because in indexedDB, the only way to update a database's tables is to create a new version of the database, with the new structure.

### Queries
| Function | Explanation | Parameters | Returns |
| ------------- |:-------------:| :-----:|:-------: |
| run | This function needs to be called at the end of the query building chain. It also clears the built up data (but not the database used) | - | Promise |
| select | Data to select. Leaving this empty will select all data | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |
| functions | Scalar or aggregate functions to apply to values. Scalar functions are applied to each value individually, and aggregate functions are applied to all values grouped together | Any number of **object** parameters, **object arrays** and any combination of the two. Each object must have a 'column' attribute (**string** column name) to relate the functions to. Scalar functions are given to the attribute **scalar** and aggregates are given to the **aggregates** attribute. Typically, a scalar function should take one parameter, whereas an aggregate function will take two (The first being the old value and the second being the new value, as the function is applied to values going down the list of results) | iDB |
| from | Specify the table to use for queries | **String** table name | iDB |
| where | Specify a list of conditions for the query. The conditions are just functions that take at least one parameter and returns a boolean value | Any number of **function** parameters, **function arrays** and any combination of the two | iDB |
| insert | Insert some data into a table in the database. How this works depends on your table structure. | Any, depending on how the table is set up (eg, maybe an object like {column1: value1}, but tables can be set up to allow just simple stings, numbers, or even arrays)  | iDB |
| into | Specify table to insert data into | **String** Table name | iDB |
| values | Optional function for people who prefer the more SQL-like look. Goes together with insert, taking insert()'s parameters instead. | see **insert** | iDB |
| limit | Limit the number of results for the cursor to query | **Integer** The positive integer value of the maximum data size | iDB |
| skip | Skip results from the start of the query | **Integer** Positive integer value of the number of results to skip | iDB |
| reverse | Use to query the table starting from the bottom | - | iDB |
| distinct | Use to query only results that are not duplicate | - | iDB |
| delete | Use this to delete data from a table | - | iDB |
| update | Use this to update data in a table | **String** table name | iDB |
| set | Use together with update() to update records with this value | **Object** A key:value object (representing column:value), matching your table structure, where the columns in the table will be updated with the new values | iDB |
| orderBy | Determine the order of records with list of column names | Any number of **string** parameters, **string arrays** and any combination of the two | iDB |
| groupBy | Group the results together by some columns |  Any number of **string** parameters, **string arrays** and any combination of the two. When using this, the returned records will be in an object, not an array | iDB |


#### You can see these two tables in the console by using ``` iDB.help()```
