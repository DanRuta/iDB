class iDB {

    constructor () {this.throwError("iDB cannot be instantiated. Use iDB.help() to log out more info.")}

    // Database management
    static exists (database) {

        if(!database) this.throwError("Database name must be specified")

        return new Promise(resolve => {

            const request = indexedDB.open(database)

            request.onupgradeneeded = e => {
                if(e.target.transaction)
                    e.target.transaction.abort()
                resolve(false)
            }
            request.onsuccess = e => {
                if(e.target.transaction)
                    e.target.transaction.abort()
                resolve(true)
            }
        })
    }

    static use (database) {
        this.databaseName = database
        return this
    }

    static setDatabase (...args) {
 
        if(!args.length) this.throwError("Database name must be specified")

        this.reset(true)

        this.databaseName = args[0]

        if(args.length==2)
            this.databaseVersion = args[1]

        else if(args.length>2) this.throwError("Invalid number of parameters. Documentation: https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open")

        return new Promise((resolve) => {

            this.openTransaction().then(() => {
                this.reset(true)                
                resolve()
            })
        })

    }

    static dropDatabase (database) { 
        if(!database) this.throwError("No database name provided")

        return new Promise((resolve, reject) => {

            const request = indexedDB.deleteDatabase(database)

            request.onsuccess = () => resolve()
            request.onerror = () => reject()

            this.reset(true)
        })
    }

    static createTable (tableName, options) {

        if(!tableName) this.throwError("Table name not specified")

        this.newTableColumns = this.newTableColumns || [] 
        this.newTablesList = this.newTablesList || [] 

        if(this.newTableData){
            this.newTablesList.push({
                tableData: this.newTableData,
                tableColumns: this.newTableColumns
            })
        }

        this.newTableData = {tableName}
        this.newTableColumns = []

        if(options) 
            this.newTableData.options = options

        this.reset(true)
        return this
    }

    static addColumn (name, options) {

        if(!this.newTableData) this.throwError("You must provide a table to add the column to.")

        if(name==null) this.throwError("You must provide a column name")

        if(name.includes(" ")) this.throwError("Column names cannot contain spaces")

        const column = {name}

        if(options){

            if(options.hasOwnProperty("keyPath")){
                column.keyPath = options.keyPath
                delete options.keyPath
            }

            if(Object.keys(options).length)
                column.options = options
        }

        column.keyPath = column.keyPath ? column.keyPath : name 


        this.newTableColumns.push(column)
        return this
    }

    static addColumns (...args) {
        this.compileListFromArguments(args, "string").forEach(this.addColumn.bind(this))
        return this
    }
    

    // Operations
    static select (...args) {

        this.validateOperation("select")

        const selectList = this.compileListFromArguments(args, "string")

        if(selectList && selectList.length)
            this.selectList = selectList

        this.operation = "select"
        return this
    }

    static functions (...args) {

        const functionList = [],

        checkObjectValidity = object => {

            if(typeof object == "object" && object == Object(object)){

                if(!object.hasOwnProperty("column"))
                    this.throwError("No column name provided in object. It must be provided to the key 'column'")

                // Make sure the scalar functions provided are in an array
                if(object.hasOwnProperty("scalar")){

                    if(typeof object.scalar == "function")
                        object.scalar = [object.scalar]

                    else if(!Array.isArray(object.scalar) || object.scalar.some(object => typeof object != "function"))
                        this.throwError("Scalar value must be either a function or array of functions")
                }

                if(object.hasOwnProperty("aggregate") && typeof object.aggregate != "function")
                    this.throwError("Aggregate value must be a function")

            }else this.throwError("Functions must be provided in objects, along with their columns. Check the documentation for more info.")

            functionList.push(object)
        }

        // Parse each item into an object readable by the rest of the library
        args.forEach(item => {
            if(Array.isArray(item))
                 item.forEach(arrayItem => checkObjectValidity(arrayItem))
            else checkObjectValidity(item)
        })

        if(functionList.length)
            this.functionsList = functionList

        return this
    }

    static insert (data) {

        this.validateOperation("add")

        this.insertData = data
        this.operation = "add"
        return this
    }

    static into (table) {

        if(!table) this.throwError("Table name must be provided")

        this.table = table
        return this
    }

    static values (data) {

        if(!data) this.throwError("No data provided")

        this.insertData = data
        return this
    }

    static limit (limitValue) {

        limitValue = parseInt(limitValue)

        if(!limitValue || !Number.isInteger(limitValue) || limitValue <= 0)
            console.warn("Limit value must be a positive integer, of value 1 or higher")
        else this.limitValue = limitValue

        return this
    }

    static skip (skipValue) {

        skipValue = parseInt(skipValue)

        if(!skipValue || !Number.isInteger(skipValue) || skipValue <= 0)
            console.warn("Skip value must be a positive integer, of value 1 or higher")
        else this.skipValue = skipValue

        return this
    }

    static reverse () {
        this.direction = "prev"
        return this
    }

    static distinct () {
        this.isDistinct = true
        return this
    }

    static delete () {

        this.validateOperation("delete")

        this.operation = "delete"
        return this
    }

    static from (table) {

        if(!table) this.throwError("Table name must be provided")

        this.table = table
        return this
    }

    static update (table) {

        this.validateOperation("update")

        if(!table) this.throwError("Table name must be provided")

        this.table = table
        this.operation = "update"
        return this
    }

    static set (updateValue) {

        if(updateValue){
            if(!Array.isArray(updateValue) && updateValue == Object(updateValue) && typeof updateValue == "object")
                this.updateValues = updateValue
            else this.throwError("Update value must be an object of keys, for relating to database structure.")
        }

        return this
    }

    static where (...args) {

        const conditionsList = this.compileListFromArguments(args, "function")

        if(conditionsList && conditionsList.length)
            this.conditionsList = conditionsList

        return this
    }

    static orderBy (...args) {

        const orderByList = this.compileListFromArguments(args, "string")

        if(orderByList && orderByList.length)
            this.orderByList = orderByList

        return this
    }

    static groupBy (...args) {        

        const groupByList = this.compileListFromArguments(args, "string")

        if(groupByList && groupByList.length)
            this.groupByList =  groupByList

        return this
    }


    static run () {

        return new Promise((resolve, reject) => {

            if(!this.databaseName) this.throwError("Database name not provided")
            if(!this.table) this.throwError("Table name not provided")

            // Clear orderBy if present for operations other than select
            if(this.operation!="select"){

                if(this.orderByList){
                    this.orderByList = null
                    console.warn(`Cannot use orderBy with: ${this.operation}`)
                }
            }


            if(this.operation=="add"){

                if(!this.insertData) return 

                this.openTransaction().then(() => {

                    const objectStore = this.transaction.objectStore(this.table)
                    objectStore.add(this.insertData)
                    objectStore.onerror = event => console.warn(`Insertion error: ${event}`)

                    this.db.close()
                    this.reset()
                    resolve()
                })

            }else{

                let recordsAffected = 0

                // Exit early if update has been called with no data to set.
                if(this.operation=="update" && !this.updateValues){
                    this.reset()
                    return resolve(recordsAffected)
                }

                if(this.operation=="delete" || this.operation=="update")
                    this.isDistinct = false
                

                this.openTransaction().then(() => {

                    let returnData = []

                    const objectStore = this.transaction.objectStore(this.table),
                    direction = `${this.direction || "next"}${this.isDistinct ? "distinct" : ""}`,
                    iterator = objectStore.openCursor(null, direction),

                    matchAgainstWhereConditions = (cursor, filteredItem) => {

                        if(this.conditionsList && this.conditionsList.some(condition => !condition(cursor.value)))
                            return

                        switch(this.operation){

                            case ("select"):

                                const recordValues = filteredItem ? filteredItem : cursor.value

                                // Apply all scalar functions to record values
                                if(this.functionsList){
                                    this.functionsList.forEach(item => {
                                        recordValues[item.column] = item.scalar ? item.scalar.reduce((prev, curr) => curr(prev), recordValues[item.column]) : recordValues[item.column] 
                                    })
                                }

                                returnData.push(recordValues)
                                break

                            case ("delete"):
                                recordsAffected++
                                cursor.delete()
                                break

                            case ("update"):
                                const updateData = cursor.value

                                for(const key in this.updateValues){
                                    updateData[key] = this.updateValues[key]
                                }

                                recordsAffected++
                                cursor.update(updateData)
                                break
                        }
                    },

                    finishQuery = hadErrors => {

                        let returnObject

                        // Group records
                        if(this.groupByList && this.groupByList.length){

                            // Filter out groupBy items not included in the selected items list, if selected items are provided
                            if(this.selectList && this.selectList.length){
                                this.groupByList = this.groupByList.filter(groupByItem => {
                                    const exists = this.selectList.includes(groupByItem)

                                    if(!exists)
                                        console.warn(`${groupByItem} not in columns selected (${this.selectList.join(", ")})`)

                                    return exists           
                                })
                            }

                            // Only continue grouping if there are no groupBy columns left after filtering
                            if(this.groupByList.length){

                                const aggregateFunctions = {}
                                returnObject = {}

                                // Pull all aggregate functions into an object for easier access and verification
                                if(this.functionsList){
                                    this.functionsList.forEach(item => {
                                        if(item.aggregate)
                                            aggregateFunctions[item.column] = item.aggregate
                                    })
                                }

                                returnData.forEach(record => {

                                    // Recursive function to group records together. Each iteration groups one column
                                    const checkGroupingAgainstList = (groupList, record, object) => {

                                        const grouping = groupList[0]
                                        let recordGroupingValue = record[grouping]
                                        const convertedRecordData = {[recordGroupingValue] : []}
                                        delete record[grouping]

                                        groupList.shift()

                                        const continueProcessing = () => {
                                            if(groupList.length)
                                                 checkGroupingAgainstList(groupList, record, object[recordGroupingValue])
                                            else object[recordGroupingValue].push(record)
                                        }

                                        // If there is an aggregation function for this grouping, execute it and continue processing
                                        if(aggregateFunctions.hasOwnProperty(grouping) && Object.keys(object).length){

                                            const existingKey = Object.keys(object)[0]
                                            recordGroupingValue = aggregateFunctions[grouping](existingKey, recordGroupingValue)

                                            // Move over the old key's content to the new one
                                            object[recordGroupingValue] = object[existingKey]
                                            delete object[existingKey]

                                            continueProcessing()

                                        }else {

                                            if(object.hasOwnProperty(recordGroupingValue)){
                                                continueProcessing()

                                            }else {

                                                // Add brand new entry
                                                if(groupList.length){

                                                    object[recordGroupingValue] = {}
                                                    checkGroupingAgainstList(groupList, record, object[recordGroupingValue])

                                                }else object[recordGroupingValue] = [record]
                                            }
                                        }
                                    }

                                    checkGroupingAgainstList(this.groupByList.slice(0), record, returnObject) 
                                })
                            }
                        }

                        // Order records, if order was specified and results aren't grouped
                        if(this.orderByList && this.orderByList.length && !returnObject){

                            // Filter out orderBy columns not present in the selected items, if given, and warn user
                            if(this.selectList && this.orderByList.length){
                                this.orderByList = this.orderByList.filter(orderByItem => {

                                    const exists = this.selectList.includes(orderByItem)

                                    if(!exists)
                                        console.warn(`${orderByItem} not in columns selected (${this.selectList.join(", ")})`)

                                    return exists
                                })
                            }

                            returnData.sort((a,b) => {                                
                                for(const orderItem of this.orderByList){
                                    if(a[orderItem]!=b[orderItem])
                                        return a[orderItem] < b[orderItem] ? -1 : 1
                                }
                            })
                        }

                        this.db.close()
                        this.reset()

                        if(hadErrors)
                             reject()
                        else {
                            if(returnObject)
                                 resolve(returnObject)
                            else resolve(Object.keys(returnData).length ? returnData : recordsAffected)
                        }
                    }

                    iterator.onsuccess = event => {

                        const cursor = event.target.result

                        // Skip values if a skip value has been provided
                        if(this.skipValue){
                            let skipValue = this.skipValue
                            this.skipValue = null
                            cursor.advance(skipValue)
                        }else {

                            if(cursor){

                                // Select all data if no specific keys have been requested, otherwise filter others out
                                if(!this.selectList){
                                    matchAgainstWhereConditions(cursor)

                                }else {
                                    const filteredItem = {}
                                    // this.selectList.forEach(item => filteredItem[item.column] = cursor.value[item.column])
                                    this.selectList.forEach(item => filteredItem[item] = cursor.value[item])
                                    matchAgainstWhereConditions(cursor, filteredItem)
                                }

                                if(!this.limitValue || returnData.length<this.limitValue)
                                     cursor.continue()
                                else finishQuery() 

                            }else finishQuery()
                        }                      
                    }

                    iterator.onerror = event => {
                        finishQuery(true)
                        this.throwError(`Error selecting data: ${iterator.error}`)
                    }    
                })
            }
        })
    }

    static openTransaction () {
        return new Promise((resolve, reject) => {

            if(!this.databaseName) this.throwError("Cannot start transaction. Database name not provided.")

            const request = indexedDB.open(this.databaseName, this.databaseVersion)

            request.onupgradeneeded = event => {

                const transaction = request.transaction 
                this.db = request.result
                this.newTablesList = this.newTablesList || [] 

                // Flush existing table creation data to the newTablesList
                if(this.newTableData){
                    this.newTablesList.push({
                        tableData: this.newTableData,
                        tableColumns: this.newTableColumns || []
                    })
                }

                const addTable = ({tableData, tableColumns}) => {

                    const objectStore = this.db.createObjectStore(tableData.tableName, tableData.options)

                    tableColumns.forEach(({name, keyPath, options}) => {
                        objectStore.createIndex(name, keyPath, options)
                    })
                }

                // Either update existing structure, or create new one
                if(event.oldVersion){

                    // Get the new and existing table data for updating comparisons 
                    const existingTableNames = Object.keys(this.db.objectStoreNames).map(key => this.db.objectStoreNames[key]),
                    newTableNames = this.newTablesList.map(table => table.tableData.tableName)

                    // First, remove old tables
                    const tablesToRemove = existingTableNames.filter(table => !newTableNames.includes(table))
                    tablesToRemove.forEach(table => {
                        this.db.deleteObjectStore(table)
                        existingTableNames.splice(existingTableNames.indexOf(table), 1)
                    })

                    // Then decide which tables are new, and need adding
                    const tablesToAdd = this.newTablesList.filter(table => !existingTableNames.includes(table.tableData.tableName))
                    tablesToAdd.forEach(addTable)

                    // Then update existing tables with new data
                    existingTableNames.forEach(existingTableName => {

                        // Get the new and existing column data for updating comparisons 
                        const table = transaction.objectStore(existingTableName, "readwrite"),

                        existingColumns = Object.keys(table.indexNames).map(key => table.indexNames[key])
                        let newColumns = []

                        this.newTablesList.some(newTable => {
                            if(newTable.tableData.tableName == existingTableName){
                                newColumns = newTable.tableColumns
                                return true
                            }
                        })

                        const newColumnsNames = newColumns.map(column => column.name),

                        // First, delete old columns
                        columnsToDelete = existingColumns.filter(column => !newColumnsNames.includes(column))
                        columnsToDelete.forEach(column => table.deleteIndex(column))

                        // Then add the new ones
                        const columnsToAdd = newColumns.filter(column => !existingColumns.includes(column.name))
                        columnsToAdd.forEach(({name, keyPath, options}) => table.createIndex(name, keyPath, options))
                    })

                }else this.newTablesList.forEach(addTable)

                this.newTablesList = []
                this.newTableData = null
                this.newTablesColumns = []
            }

            request.onerror = () => {
                this.reset()
                this.throwError(`Error opening database ${request.error}`)
            }

            request.onsuccess = () => {

                if(this.table){
                    this.db = request.result
                    this.transaction = request.result.transaction(this.table, "readwrite")

                    this.transaction.oncomplete = () => {
                        this.transaction = null
                        this.db.close()
                    }

                }else request.result.close()

                resolve()
            }
        })
    }

    static reset (hard) {

        if(hard) this.databaseName = null

        this.operation = null
        this.table = null
        this.limitValue = null
        this.selectList = null
        this.functionsList = null
        this.insertData = null
        this.skipValue = null
        this.direction = "next"
        this.isDistinct = false
        this.conditionsList = null
        this.updateValues = null
        this.orderByList = null
        this.groupByList = null

        this.objectStoreProperties = null
    }

    static validateOperation (operation) {

        if(this.operation && this.operation!=operation)  
            this.throwError(`Multiple operations are not supported. (Existing operation: ${this.operation})`)

        else if(this.operation==operation) console.warn(`Duplicate operation: ${operation}`)
    }

    static throwError (message) {
        this.reset()
        throw new Error(message)
    }

    static compileListFromArguments (args, type) {

        let list = []

        args.forEach(item => {
            if(typeof item === type)
                list.push(item)

            else if(Array.isArray(item)){

                if(item.some(subItem => typeof subItem !== type))
                    this.throwError(`Arguments must all be ${type}s`)
                else list = list.concat(item)

            }else this.throwError(`Arguments must all be ${type}s`)
        })

        return list
    }

    static help () {

        console.info("Database Management")

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
            setDatabase : {
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
            },
            exists: {
                explanation: "Check if a database exists",
                parameters: "[0-String] Database name",
                returns: "Promise (with Boolean)"
            }
        })

        console.info("Reading and writing data")

        console.table({
            run: {
                explanation: "This function needs to be called at the end of the query building chain. It also clears that data once run (but not the database beign used)",
                parameters: "none",
                returns: "Promise"                        
            },
            select : {
                explanation: "Data to select",
                parameters: "Any number of string parameters, string arrays and any combination of the two (Optional) - Leaving it empty will select all keys",
                returns: "iDB"
            },
            functions: {
                explanation: "Scalar or aggregate functions to apply to values. Scalar functions are applied to each value individually, and aggregate functions are applied to all values grouped together",
                parameters: "Any number of object parameters, arrays of object parameters or any combination of the two.",
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
                returns : "iDB"
            },
            orderBy: {
                explanation: "Determine the order of records with list of column names",
                parameters: "Any number of string parameters, arrays of string parameters and any combination of the two",
                returns: "iDB"
            },
            groupBy: {
                explanation: "Group the results together by some columns",
                parameters: "Any number of string parameters, arrays of string parameters and any combination of the two",
                returns: "iDB"
            }
        })
    }
}