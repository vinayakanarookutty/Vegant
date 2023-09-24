var db = require("../config/connection")
var j = require('../config/collections');
const { PRODUCT_COLLECTIONS } = require("../config/collections");
const { response } = require("express");
const { ObjectId } = require("mongodb");
const bcrypt=require('bcrypt');
const { request } = require("../app");
var objectid = require('mongodb').ObjectId;
module.exports = {
    
    addproducts: (product, callback) => {

        db.get().collection('product').insertOne(product).then((data) => {

            callback(data.insertedId);
        })
    },
    getallProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(j.PRODUCT_COLLECTIONS).find().toArray()
            resolve(products)
        })
    },
    
    deleteProducts: (prid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(j.PRODUCT_COLLECTIONS).deleteOne({ _id: objectid(prid) }).then((response) => {
                //console.log(response)
                resolve(response)
            })
        })

    },
    getProductDetails: (prid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(j.PRODUCT_COLLECTIONS).findOne({ _id: objectid(prid) }).then((response) => {

                resolve(response)
            })
        })

    },
    updateproduct: (prid, productdetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(j.PRODUCT_COLLECTIONS).updateOne({ _id: objectid(prid) }, {
                $set: {
                    Name: productdetails.Name,
                    Description: productdetails.Description,
                    Price: productdetails.Price,
                    Catagory: productdetails.Catagory
                }
            }

            ).then((response) => {

                resolve(response)
            })
        })

    },
    cartProducts: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(j.CART_COLLECTION).aggregate
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
                            id:'$products._id',
                            Name:'$products.Catagory',
                            Description:'$products.Price'
                        }
                    },
                    {
                        $lookup:{
                            from:j.PRODUCT_COLLECTIONS,
                            localField:'item',
                            foreignField:'_id',
                            as:'products',
                        }
                    },
                    
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$products',0]}
                        }
                    }
                ]).toArray()
                console.log(cartItems[0].products)
            resolve(cartItems)
        })
    },
    doaSignup:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
        adminData.password=await bcrypt.hash(adminData.password,10)   
        adminData= await db.get().collection('admin').insertOne(adminData).then((data) => {
            resolve(data)
        })
    })
},
doaLogin:(userData)=>
{
    // return new Promise(async(resolve,reject)=>
    // {
    //     let loginStatus=false
    //     let response={}
    //     let admin=await db.get().collection('admin').findOne({mail:userData.mail})
    //     if(user)
    //     {
    //         bcrypt.compare(adminData.password,admin.password).then((status)=>{
    //         if(status)  
    //         {
    //             console.log("Login Sucess");
    //             response.user=user
    //             response.status=true
    //             resolve(response)
    //         }              
    //         else
    //         {
    //             console.log("login Failed")
    //             resolve({status:false})
    //         }
    //     })
    //     }
    //     else
    //     {
    //         console.log("LOGIN FAILED")
    //         resolve({status:false})
    //     }
    // })
    return new Promise(async(resolve,reject)=>{
        if(userData.mail==='vegant'||userData.password==='hello')
        {
            resolve({status:true})
        }
    })

},


getallorders: () => {
    return new Promise(async (resolve, reject) => {
        let orders = await db.get().collection(j.ORDER_COLLECTION).find().toArray()
        resolve(orders)
        let user=await db.get().collection(j.ORDER_COLLECTION).aggregate
        ([
            {
                $lookup:{
                    from:j.USER_COLLECTION,
                    localField:'userid',
                    foreignField:'name',
                    as:'userdetails',
                }
            },
            
            {
                $project:{
                    name:1,mob:1,userdetails:{$arrayElemAt:['$userdetails',0]}
                }
            }
        ]).toArray()
        resolve(user)
    })
},
getuser: () => {
    return new Promise(async (resolve, reject) => {
        let user=await db.get().collection(j.ORDER_COLLECTION).aggregate
        ([
            {
                $lookup:{
                    from:j.USER_COLLECTION,
                    localField:'userid',
                    foreignField:'name',
                    as:'userdetails',
                }
            },
            
            {
                $project:{
                    name:1,mob:1,userdetails:{$arrayElemAt:['$userdetails',0]}
                }
            }
        ]).toArray()
        resolve(user)
    })
},
getalluser: ()=>{
    return new Promise(async (resolve, reject) => {
        users=db.get().collection(j.USER_COLLECTION).find().toArray()
        console.log(users)
        resolve(users)
    })
},
deleteuser: (prid) => {
    return new Promise((resolve, reject) => {
        db.get().collection(j.USER_COLLECTION).deleteOne({ _id: objectid(prid) }).then((response) => {
            //console.log(response)
            resolve(response)
        })
    })

}
}
