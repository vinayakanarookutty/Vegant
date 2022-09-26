var db = require("../config/connection")
var j = require('../config/collections')
const bcrypt = require('bcrypt')
const { use } = require("../routes/users")
const { response } = require("../app")
const mongoClient = require('mongodb').MongoClient
var objectid = require('mongodb').ObjectId;
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_1exGQNVLgiKCey',
  key_secret: 'JYvTJH7rFnZyJldZyhoi51Lm',
});
module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            userData = await db.get().collection(j.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(j.USER_COLLECTION).findOne({ mail: userData.mail })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("Login Sucess");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("login Failed")
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("LOGIN FAILED")
                resolve({ status: false })
            }
        })
    },
    addToCart: (proid, userid) => {

        let proobj = {
            item: objectid(proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(j.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (userCart) {
                let proExist = userCart.product.findIndex(products => products.item == proid)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(j.CART_COLLECTION)
                        .updateOne({ user: objectid(userid), 'product.item': objectid(proid) },
                            {
                                $inc: { 'product.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                }
                else {
                    db.get().collection(j.CART_COLLECTION).updateOne({ user: objectid(userid) },

                        {

                            $push: { product: proobj }

                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                let cartobj = {
                    user: objectid(userid),
                    product: [proobj]
                }
                db.get().collection(j.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getcartCount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(j.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (cart) {
                count = cart.product.length;
            }
            resolve(count);
        })
    },
    changeProductQuantity:(details)=>
{
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
     
    return new Promise((resolve, reject) => {
        if (details.count==-1 && details.quantity==1) 
        {   
            db.get().collection(j.CART_COLLECTION)
            .updateOne({ _id: objectid(details.cart) },
                {
                    $pull: { product: { item: objectid(details.product) } }
                }
              ).then((response) => {
                    resolve({ removeProduct: true })
                })  

        } 
        else
        {
            db.get().collection(j.CART_COLLECTION)
           .updateOne({ _id: objectid(details.cart), 'product.item': objectid(details.product) },
               {
                   $inc: { 'product.$.quantity': details.count }
               }
           ).then((response) => {
               resolve({status:true})
           }) 
        }   
    })
},
getTotalAmount:(userid)=>{
    return new Promise(async (resolve, reject) => {
        let sum = await db.get().collection(j.CART_COLLECTION).aggregate
            ([
                {
                    $match: { user: objectid(userid) }
                },
                {
                    $unwind:'$product',
                    
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity',
                        
                    }
                },
                {
                    $lookup:{
                        from:j.PRODUCT_COLLECTIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'products12',
                    }
                },
                {
                    $project:{
                       
                        item:1,quantity:1,Price:1,products12:{$arrayElemAt:['$products12',0]},
                       
                    }
                },
                {
                    $group:{
                        _id:null,
                       total:{$sum:{$multiply:['$quantity','$products12.Price']}}
                    
                    }
                }

            ]).toArray()
            
        resolve(sum[0].total)
    })

},
PlaceOrder:(order,products,total)=>
{
    return new Promise((resolve, reject) => {
    // console.log(products)
    let status=order.payment==='COD'?'Placed':'Pending'
    let ordobj={
        deliveryDetails:{
            mobile:order.mobile,
            address:order.address,
            pincode:order.pincode
            
        },
        userid:objectid(order.userid),
        name:order.name,
        payment:order.payment,
        totalamount:total,
        date: new Date(),
        status:status,
        productsname:products.Name,
        productsquantity:products.quantity

    }
     db.get().collection(j.ORDER_COLLECTION).insertOne(ordobj).then(()=>{
        db.get().collection(j.CART_COLLECTION).deleteOne({user:objectid(order.userid)})
        resolve()
     })
    })

},
getcartList:(userid)=>{
    return new Promise(async(resolve,reject)=>{
    let cart=await db.get().collection(j.CART_COLLECTION).findOne({user: objectid(userid)})
    resolve(cart.product)
    })

},
getUserOrder:(userid)=>{
    return new Promise(async(resolve, reject) => {
    console.log(userid)
    let orders=await db.get().collection(j.ORDER_COLLECTION)
    .find({userid:objectid(userid)}).toArray()
   
    resolve(orders)
    })
},
getOrderProducts:(orderId)=>{
    return new Promise(async (resolve, reject) => {
        let orderitems= await db.get().collection(j.ORDER_COLLECTION).aggregate
            ([
                {
                    $match: { user: objectid(orderId) }
                },
                {
                    $lookup:{
                        from:j.CART_COLLECTION,
                        localField:'userid',
                        foreignField:'_id',
                        as:'products12',
                    }
                },
               
                // {
                //     $unwind:'$product',
                    
                // },
                // {
                //     $project:{
                //         item:'$product.item',
                //         quantity:'$product.quantity',
                        
                //     }
                // },
                {
                    $project:{
                       
                        item:1,quantity:1,products12:{$arrayElemAt:['$products12',0]}
                       
                    }

                }

            ]).toArray()
           console.log(orderitems) 
        resolve(orderitems)
    })


},
generateRazorpay:(orderId,total)=>{
    console.log(total)
return new Promise((resolve, reject) =>{
  var option={
    amount:total,
    currency:"INR",
    receipt:""+orderId
  };
  instance.orders.create(option,(err,order)=>{
    if(err)
    {
        console.log(err)
    }
    else
    {
    console.log("New Order:",order);
    resolve(order);
    }
  })
})
},
removeitem:(body)=>{
     
    return new Promise((resolve, reject) => {
        db.get().collection(j.CART_COLLECTION)
        .updateOne({ _id: objectid(body.cart) },
            {
                $pull: { product: { item: objectid(body.product) } }
            }
          ).then((response) => {
                resolve({ removeProduct: true })
            })  

    
    })

},
getOrderId:(userid)=>{
    return new Promise(async (resolve, reject) => {
        let helloid = await db.get().collection(j.CART_COLLECTION).aggregate
            ([
                {
                    $match: { user: objectid(userid) }
                },
                {
                    $unwind:'$product',
                    
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity',
                        
                    }
                },
                {
                    $lookup:{
                        from:j.PRODUCT_COLLECTIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'products12',
                    }
                },
                {
                    $project:{
                       
                        item:1,quantity:1,Price:1,products12:{$arrayElemAt:['$products12',0]},
                       
                    }
                },
                {
                    $group:{
                        _id:'$products12._id',
                       total:{$sum:{$multiply:['$quantity','$products12.Price']}}
                    
                    }
                }

            ]).toArray()
            console.log(helloid)
      
        resolve(helloid[0]._id)
    })

},
getuser: (userid)=>{
    return new Promise(async (resolve, reject) => {
        // db.get().collection(j.USER_COLLECTION).find({_id: objectid(userid)}).toArray()
        // console.log(users)
        let users = await db.get().collection(j.USER_COLLECTION).aggregate(
            [
                {
                    $match: { user: objectid(userid) }
                },
               
            ]
        ).toArray()
        console.log(users)
        resolve(users)
    })
}


}
