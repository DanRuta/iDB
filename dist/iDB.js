"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var iDB = function () {
    function iDB() {
        _classCallCheck(this, iDB);

        this.throwError("iDB cannot be instantiated. Use iDB.help() to log out more info.");
    }

    // Database management


    _createClass(iDB, null, [{
        key: "use",
        value: function use(database) {
            this.databaseName = database;
            return this;
        }
    }, {
        key: "setDatabase",
        value: function setDatabase() {

            if (!arguments.length) this.throwError("Database name must be specified");

            this.reset(true);

            this.databaseName = arguments.length <= 0 ? undefined : arguments[0];

            if (arguments.length == 2) this.databaseVersion = arguments.length <= 1 ? undefined : arguments[1];else if (arguments.length > 2) this.throwError("Invalid number of parameters. Documentation: https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open");

            this.openTransaction();
            this.reset(true);
        }
    }, {
        key: "dropDatabase",
        value: function dropDatabase(database) {
            var _this = this;

            if (!database) this.throwError("No database name provided");

            return new Promise(function (resolve, reject) {

                var request = indexedDB.deleteDatabase(database);

                request.onsuccess = function () {
                    return resolve();
                };
                request.onerror = function () {
                    return reject();
                };

                _this.reset(true);
            });
        }
    }, {
        key: "createTable",
        value: function createTable(tableName, options) {

            if (!tableName) this.throwError("Table name not specified");

            this.newTableColumns = this.newTableColumns || [];
            this.newTablesList = this.newTablesList || [];

            if (this.newTableData) {
                this.newTablesList.push({
                    tableData: this.newTableData,
                    tableColumns: this.newTableColumns
                });
            }

            this.newTableData = { tableName: tableName };
            this.newTableColumns = [];

            if (options) this.newTableData.options = options;

            this.reset(true);
            return this;
        }
    }, {
        key: "addColumn",
        value: function addColumn(name, options) {

            if (!this.newTableData) this.throwError("You must provide a table to add the column to.");

            if (name == null) this.throwError("You must provide a column name");

            if (name.includes(" ")) this.throwError("Column names cannot contain spaces");

            var column = { name: name };

            if (options) {

                if (options.hasOwnProperty("keyPath")) {
                    column.keyPath = options.keyPath;
                    delete options.keyPath;
                }

                if (Object.keys(options).length) column.options = options;
            }

            column.keyPath = column.keyPath ? column.keyPath : name;

            this.newTableColumns.push(column);
            return this;
        }
    }, {
        key: "addColumns",
        value: function addColumns() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            this.compileListFromArguments(args, "string").forEach(this.addColumn.bind(this));
        }

        // Operations

    }, {
        key: "select",
        value: function select() {

            this.validateOperation("select");

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            var selectKeysList = this.compileListFromArguments(args, "string");

            if (selectKeysList && selectKeysList.length) this.selectKeys = selectKeysList;

            this.operation = "select";
            return this;
        }
    }, {
        key: "insert",
        value: function insert(data) {

            this.validateOperation("add");

            this.insertData = data;
            this.operation = "add";
            return this;
        }
    }, {
        key: "into",
        value: function into(table) {

            if (!table) this.throwError("Table name must be provided");

            this.table = table;
            return this;
        }
    }, {
        key: "values",
        value: function values(data) {

            if (!data) this.throwError("No data provided");

            this.insertData = data;
            return this;
        }
    }, {
        key: "limit",
        value: function limit(limitValue) {

            limitValue = parseInt(limitValue);

            if (!limitValue || !Number.isInteger(limitValue) || limitValue <= 0) console.warn("Limit value must be a positive integer, of value 1 or higher");else this.limitValue = limitValue;

            return this;
        }
    }, {
        key: "skip",
        value: function skip(skipValue) {

            skipValue = parseInt(skipValue);

            if (!skipValue || !Number.isInteger(skipValue) || skipValue <= 0) console.warn("Skip value must be a positive integer, of value 1 or higher");else this.skipValue = skipValue;

            return this;
        }
    }, {
        key: "reverse",
        value: function reverse() {
            this.direction = "prev";
            return this;
        }
    }, {
        key: "distinct",
        value: function distinct() {
            this.isDistinct = true;
            return this;
        }
    }, {
        key: "delete",
        value: function _delete() {

            this.validateOperation("delete");

            this.operation = "delete";
            return this;
        }
    }, {
        key: "from",
        value: function from(table) {

            if (!table) this.throwError("Table name must be provided");

            this.table = table;
            return this;
        }
    }, {
        key: "update",
        value: function update(table) {

            this.validateOperation("update");

            if (!table) this.throwError("Table name must be provided");

            this.table = table;
            this.operation = "update";
            return this;
        }
    }, {
        key: "set",
        value: function set(updateValue) {

            if (updateValue) {
                if (!Array.isArray(updateValue) && updateValue == Object(updateValue) && (typeof updateValue === "undefined" ? "undefined" : _typeof(updateValue)) == "object") this.updateValues = updateValue;else this.throwError("Update value must be an object of keys, for relating to database structure.");
            }

            return this;
        }
    }, {
        key: "where",
        value: function where() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            var conditionsList = this.compileListFromArguments(args, "function");

            if (conditionsList && conditionsList.length) this.conditionsList = conditionsList;

            return this;
        }
    }, {
        key: "orderBy",
        value: function orderBy() {
            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
            }

            var orderByList = this.compileListFromArguments(args, "string");

            if (orderByList && orderByList.length) this.orderByList = orderByList;

            return this;
        }
    }, {
        key: "run",
        value: function run() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {

                if (!_this2.databaseName) _this2.throwError("Database name not provided");
                if (!_this2.table) _this2.throwError("Table name not provided");

                // Clear orderBy if present for operations other than select
                if (_this2.operation != "select") {

                    if (_this2.orderByList) {
                        _this2.orderByList = null;
                        console.warn("Cannot use orderBy with: " + _this2.operation);
                    }
                }

                if (_this2.operation == "add") {

                    if (!_this2.insertData) return;

                    _this2.openTransaction().then(function () {

                        var objectStore = _this2.transaction.objectStore(_this2.table);
                        objectStore.add(_this2.insertData);
                        objectStore.onerror = function (event) {
                            return console.warn("Insertion error: " + event);
                        };

                        _this2.db.close();
                        _this2.reset();
                        resolve();
                    });
                } else {
                    var _ret = function () {

                        var recordsAffected = 0;

                        // Exit early if update has been called with no data to set.
                        if (_this2.operation == "update" && !_this2.updateValues) {
                            _this2.reset();
                            return {
                                v: resolve(recordsAffected)
                            };
                        }

                        if (_this2.operation == "delete" || _this2.operation == "update") _this2.isDistinct = false;

                        _this2.openTransaction().then(function () {

                            var returnData = [];

                            var objectStore = _this2.transaction.objectStore(_this2.table),
                                direction = "" + (_this2.direction || "next") + (_this2.isDistinct ? "distinct" : ""),
                                iterator = objectStore.openCursor(null, direction),
                                matchAgainstWhereConditions = function matchAgainstWhereConditions(cursor, filteredItem) {

                                if (_this2.conditionsList && _this2.conditionsList.some(function (condition) {
                                    return !condition(cursor.value);
                                })) return;

                                switch (_this2.operation) {

                                    case "select":
                                        returnData.push(filteredItem ? filteredItem : cursor.value);
                                        break;

                                    case "delete":
                                        recordsAffected++;
                                        cursor.delete();
                                        break;

                                    case "update":
                                        var updateData = cursor.value;

                                        for (var key in _this2.updateValues) {
                                            updateData[key] = _this2.updateValues[key];
                                        }

                                        recordsAffected++;
                                        cursor.update(updateData);
                                        break;
                                }
                            },
                                finishQuery = function finishQuery(hadErrors) {

                                // Order records, if order was specified
                                if (_this2.orderByList && _this2.orderByList.length) {

                                    returnData.sort(function (a, b) {
                                        var _iteratorNormalCompletion = true;
                                        var _didIteratorError = false;
                                        var _iteratorError = undefined;

                                        try {
                                            for (var _iterator = _this2.orderByList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                                var orderItem = _step.value;

                                                if (a[orderItem] != b[orderItem]) return a[orderItem] < b[orderItem] ? -1 : 1;
                                            }
                                        } catch (err) {
                                            _didIteratorError = true;
                                            _iteratorError = err;
                                        } finally {
                                            try {
                                                if (!_iteratorNormalCompletion && _iterator.return) {
                                                    _iterator.return();
                                                }
                                            } finally {
                                                if (_didIteratorError) {
                                                    throw _iteratorError;
                                                }
                                            }
                                        }
                                    });
                                }

                                _this2.db.close();
                                _this2.reset();

                                if (hadErrors) reject();else resolve(Object.keys(returnData).length ? returnData : recordsAffected);
                            };

                            iterator.onsuccess = function (event) {

                                var cursor = event.target.result;

                                // Skip values if a skip value has been provided
                                if (_this2.skipValue) {
                                    var skipValue = _this2.skipValue;
                                    _this2.skipValue = null;
                                    cursor.advance(skipValue);
                                } else {

                                    if (cursor) {

                                        // Select all data if no specific keys have been requested, otherwise filter others out
                                        if (!_this2.selectKeys) {
                                            matchAgainstWhereConditions(cursor);
                                        } else {
                                            (function () {
                                                var filteredItem = {};
                                                _this2.selectKeys.forEach(function (key) {
                                                    return filteredItem[key] = cursor.value[key];
                                                });
                                                matchAgainstWhereConditions(cursor, filteredItem);
                                            })();
                                        }

                                        if (!_this2.limitValue || returnData.length < _this2.limitValue) cursor.continue();else finishQuery();
                                    } else finishQuery();
                                }
                            };

                            iterator.onerror = function (event) {
                                finishQuery(true);
                                _this2.throwError("Error selecting data: " + iterator.error);
                            };
                        });
                    }();

                    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
                }
            });
        }
    }, {
        key: "openTransaction",
        value: function openTransaction() {
            var _this3 = this;

            return new Promise(function (resolve, reject) {

                if (!_this3.databaseName) _this3.throwError("Cannot start transaction. Database name not provided.");

                var request = indexedDB.open(_this3.databaseName, _this3.databaseVersion);

                request.onupgradeneeded = function () {

                    var transaction = request.transaction;
                    _this3.db = request.result;
                    _this3.newTablesList = _this3.newTablesList || [];

                    // Flush existing table creation data to the newTablesList
                    if (_this3.newTableData) {
                        _this3.newTablesList.push({
                            tableData: _this3.newTableData,
                            tableColumns: _this3.newTableColumns || []
                        });
                    }

                    var addTable = function addTable(_ref) {
                        var tableData = _ref.tableData,
                            tableColumns = _ref.tableColumns;


                        var objectStore = _this3.db.createObjectStore(tableData.tableName, tableData.options);

                        tableColumns.forEach(function (_ref2) {
                            var name = _ref2.name,
                                keyPath = _ref2.keyPath,
                                options = _ref2.options;

                            objectStore.createIndex(name, keyPath, options);
                        });
                    };

                    // Either update existing structure, or create new one
                    if (event.oldVersion) {
                        (function () {

                            // Get the new and existing table data for updating comparisons 
                            var existingTableNames = Object.keys(_this3.db.objectStoreNames).map(function (key) {
                                return _this3.db.objectStoreNames[key];
                            }),
                                newTableNames = _this3.newTablesList.map(function (table) {
                                return table.tableData.tableName;
                            });

                            // First, remove old tables
                            var tablesToRemove = existingTableNames.filter(function (table) {
                                return !newTableNames.includes(table);
                            });
                            tablesToRemove.forEach(function (table) {
                                _this3.db.deleteObjectStore(table);
                                existingTableNames.splice(existingTableNames.indexOf(table), 1);
                            });

                            // Then decide which tables are new, and need adding
                            var tablesToAdd = _this3.newTablesList.filter(function (table) {
                                return !existingTableNames.includes(table.tableData.tableName);
                            });
                            tablesToAdd.forEach(addTable);

                            // Then update existing tables with new data
                            existingTableNames.forEach(function (existingTableName) {

                                // Get the new and existing column data for updating comparisons 
                                var table = transaction.objectStore(existingTableName, "readwrite"),
                                    existingColumns = Object.keys(table.indexNames).map(function (key) {
                                    return table.indexNames[key];
                                });
                                var newColumns = [];

                                _this3.newTablesList.some(function (newTable) {
                                    if (newTable.tableData.tableName == existingTableName) {
                                        newColumns = newTable.tableColumns;
                                        return true;
                                    }
                                });

                                var newColumnsNames = newColumns.map(function (column) {
                                    return column.name;
                                }),


                                // First, delete old columns
                                columnsToDelete = existingColumns.filter(function (column) {
                                    return !newColumnsNames.includes(column);
                                });
                                columnsToDelete.forEach(function (column) {
                                    return table.deleteIndex(column);
                                });

                                // Then add the new ones
                                var columnsToAdd = newColumns.filter(function (column) {
                                    return !existingColumns.includes(column.name);
                                });
                                columnsToAdd.forEach(function (_ref3) {
                                    var name = _ref3.name,
                                        keyPath = _ref3.keyPath,
                                        options = _ref3.options;
                                    return table.createIndex(name, keyPath, options);
                                });
                            });
                        })();
                    } else _this3.newTablesList.forEach(addTable);

                    _this3.newTablesList = [];
                    _this3.newTableData = null;
                    _this3.newTablesColumns = [];
                };

                request.onerror = function () {
                    _this3.reset();
                    _this3.throwError("Error opening database " + request.error);
                };

                request.onsuccess = function () {

                    if (_this3.table) {
                        _this3.db = request.result;
                        _this3.transaction = request.result.transaction(_this3.table, "readwrite");

                        _this3.transaction.oncomplete = function () {
                            _this3.transaction = null;
                            _this3.db.close();
                        };
                    } else request.result.close();

                    resolve();
                };
            });
        }
    }, {
        key: "reset",
        value: function reset(hard) {

            if (hard) this.databaseName = null;

            this.operation = null;
            this.table = null;
            this.limitValue = null;
            this.selectKeys = null;
            this.insertData = null;
            this.skipValue = null;
            this.direction = "next";
            this.isDistinct = false;
            this.conditionsList = null;
            this.updateValues = null;
            this.orderByList = null;

            this.objectStoreProperties = null;
        }
    }, {
        key: "validateOperation",
        value: function validateOperation(operation) {

            if (this.operation && this.operation != operation) this.throwError("Multiple operations are not supported. (Existing operation: " + this.operation + ")");else if (this.operation == operation) console.warn("Duplicate operation: " + operation);
        }
    }, {
        key: "throwError",
        value: function throwError(message) {
            this.reset();
            throw new Error(message);
        }
    }, {
        key: "compileListFromArguments",
        value: function compileListFromArguments(args, type) {
            var _this4 = this;

            var list = [];

            args.forEach(function (item) {
                if ((typeof item === "undefined" ? "undefined" : _typeof(item)) === type) list.push(item);else if (Array.isArray(item)) {

                    if (item.some(function (subItem) {
                        return (typeof subItem === "undefined" ? "undefined" : _typeof(subItem)) !== type;
                    })) _this4.throwError("Arguments must all be functions " + type + "s");else list = list.concat(item);
                } else _this4.throwError("Arguments must all be " + type + "s");
            });

            return list;
        }
    }, {
        key: "help",
        value: function help() {

            console.info("Database Management");

            console.table({
                createTable: {
                    explanation: "Start configuring a new table. The name must be provided, and optionally, the configuration details.",
                    parameters: "[0-String] Table name [1-Object] Configuration options (Optional)",
                    returns: "iDB"
                },
                addColumn: {
                    explanation: "Add a column to a new table. You need to provide the name, then optionally, the configuration data.",
                    parameters: "[0-String] Column name [1-Object] Options (Optional)",
                    returns: "iDB"
                },
                addColumns: {
                    explanation: "A helper function to make it easier to input a larger list of columns, when names are the only parameter",
                    parameters: "Any number of string parameters, string arrays and any combination of the two",
                    returns: "iDB"
                },
                setDatabase: {
                    explanation: "Create a database, or increase existing database version.",
                    parameters: "[0-String] Database name [1-Integer] Version (Optional)",
                    returns: "Promise"
                },
                dropDatabase: {
                    explanation: "Drop an existing database",
                    parameters: "[0-String] Database name",
                    returns: "Promise"
                },
                use: {
                    explanation: "Select the database to use. This does not get reset after queries, so setting it once should be enough.",
                    parameters: "[0-String] Database name",
                    returns: "iDB"
                }
            });

            console.info("Reading and writing data");

            console.table({
                run: {
                    explanation: "This function needs to be called at the end of the query building chain. It also clears that data once run (but not the database beign used)",
                    parameters: "none",
                    returns: "Promise"
                },
                select: {
                    explanation: "Data to select",
                    parameters: "Any number of string parameters, string arrays and any combination of the two (Optional) - Leaving it empty will select all keys",
                    returns: "iDB"
                },
                from: {
                    explanation: "Specify the table to use for queries",
                    parameters: "[0-String] Table name",
                    returns: "iDB"
                },
                where: {
                    explanation: "Specify a list of conditions for the query. The conditions are functions that take a parameter and return a boolean value",
                    parameters: "Any number of function parameters, arrays of function parameters and any combination of the two",
                    returns: "iDB"
                },
                insert: {
                    explanation: "Insert data into a table in a database",
                    parameters: "[0-Object] Data assigned the the keys matching the table structure",
                    returns: "iDB"
                },
                into: {
                    explanation: "Specify table to insert data into",
                    parameters: "[0-String] Table name",
                    returns: "iDB"
                },
                values: {
                    explanation: "Optional function for people who prefer the more SQL-like look. Goes together with insert, when select is given no parameters",
                    parameters: "[0-Object] Data assigned the the keys matching the table structure",
                    returns: "iDB"
                },
                limit: {
                    explanation: "Limit the number of results for the cursor to query",
                    parameters: "[0-Integer] The positive integer value of the maximum data size",
                    returns: "iDB"
                },
                skip: {
                    explanation: "Skip results from the start of the query",
                    parameters: "[0-Integer] Positive integer value of the number or results to skip",
                    returns: "iDB"
                },
                reverse: {
                    explanation: "Use to query the table starting from the bottom",
                    parameters: "none",
                    returns: "iDB"
                },
                distinct: {
                    explanation: "Use to query only results that are not duplicates",
                    parameters: "none",
                    returns: "iDB"
                },
                delete: {
                    explanation: "Use this to delete data from a table",
                    parameters: "none",
                    returns: "iDB"
                },
                update: {
                    explanation: "Use this to update data in a table",
                    parameters: "[0-String] Table name",
                    returns: "iDB"
                },
                set: {
                    explanation: "Use together with update() to update records with this value",
                    parameters: "[0-Object] A key value object of what values each column should update to",
                    returns: "iDB"
                },
                orderBy: {
                    explanation: "Determine the order of records with list of column names",
                    parameters: "Any number of string parameters, arrays of string parameters and any combination",
                    returns: "iDB"
                }
            });
        }
    }]);

    return iDB;
}();
