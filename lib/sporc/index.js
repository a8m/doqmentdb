/*
  List of functions that should be support concurrency / atomic transaction using stored procedures
    1. update(findAnd... functions)
    2. findOrCreate ?

  Pseudo code:
  update(...) {
    // hooks, schema validation ...

    if  support-concurrency
      # the simple process
      make the find in the same sporc
      then extend(with operation) in the same function the return object(from find)
      then replace the object with extend one

    // hooks, ...
  }

  # cheat sheet:
    find({}/undefined) => 'SELECT * from root r'(i.e: without 'WHERE')
 */