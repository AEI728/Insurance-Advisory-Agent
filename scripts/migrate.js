const {db}=require('./context').context();console.log(JSON.stringify({migration:db.pragma('user_version',{simple:true})}));db.close();
