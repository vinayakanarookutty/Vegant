const { response, Router } = require('express');
var express = require('express');
const { routes } = require('../app');
var router = express.Router();
var producthelper= require('../helpers/product-helpers')
var userhelper= require('../helpers/userhelper')
const nodemailer = require("nodemailer");
require('dotenv').config()
// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
console.log(accountSid)
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid,authToken);

const varify=(req,res,next)=>{
  if(req.session.loggededIn)
  {
    next()
  }
  else
  {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/home',(req,res)=>{
  client.messages

  .create({
     body: 'YOUR ORDER PLACED SUCCESSFULLY',
     from: '+17472479122',
     to: '+91 62381 82606'
   })
  .then(message => console.log(message.sid))
  .catch((err)=>console.log(err))
  .done();
res.render('home',{admin:false});
}),
router.get('/',async function(req, res, next) {
  let user=req.session.user
  console.log(user);
  let cartCount=null;
  if(req.session.user)
  {
  cartCount=await userhelper.getcartCount(req.session.user._id)
  }
  producthelper.getallProducts().then((products)=>{
    res.render('users',{admin:false,products,user,cartCount});
  }) 
});
router.get('/login',(req,res)=>{
  if(req.session.loggededIn)
  {
    res.redirect('/')
  }
  else
  {

  res.render('User/login',{"logerror":req.session.logginerr})
  req.session.logginerr =false
  }
})
router.get('/signup',(req,res)=>{
  res.render('User/signup')
})
router.post('/signup',(req,res)=>{
  userhelper.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggededIn = true
    req.session.user =response
    res.redirect('/login')            
  })
  
})
router.post('/login',(req,res)=>
{
  userhelper.doLogin(req.body).then((response)=>{
    if(response.status)
    {
      req.session.loggededIn = true
      req.session.user =response.user
      res.redirect('/login')
    }
    else{
      req.session.logginerr =true
      res.redirect('/login')
    }
  })

})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})
router.get('/user/carts',varify,async(req,res)=>{
  let product=await producthelper.cartProducts(req.session.user._id);
  let Totalvalue=await userhelper.getTotalAmount(req.session.user._id)
  console.log(product)
  res.render('User/cart.hbs',{admin:false,product,Totalvalue,user:req.session.user})
})
router.get('/add-to-cart/:id',varify,(req,res)=>{
  console.log("ethi mone")
userhelper.addToCart(req.params.id,req.session.user._id).then(()=>{

 res.json({status:true});
 console.log("POYI");
})
}),
router.post('/change-product-quantity',(req,res,next)=>{
  userhelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userhelper.getTotalAmount(req.body.userid)
    res.json(response)
  
  })

}),
router.get('/place-order',varify,async(req,res,next)=>{
let Total=await userhelper.getTotalAmount(req.session.user._id)
console.log(Total)
  res.render('User/place-order', {admin:false,Total,user:req.session.user})


}),
router.post('/place-order',async(req,res,next)=>{
  let productsss=await userhelper.getcartList(req.body.userid)
  let total=await userhelper.getTotalAmount(req.body.userid)
  let order=await userhelper.getOrderId(req.body.userid)
  console.log(productsss);
  userhelper.PlaceOrder(req.body,productsss,total).then(()=>{
   
    if(req.body['payment']==='COD')
    {
      res.json({codsuccess:true})
    }
    else
    {
      userhelper.generateRazorpay(order,total).then((response)=>{
        res.json(response)
      })
    }
  })
}),
router.get('/order-success',varify,(req,res)=>{
  res.render('User/order-success',{admin:false,user:req.session.user})
}),
router.get('/orders',varify,async(req,res)=>{
  let orders=await userhelper.getUserOrder(req.session.user._id)
  // let productsss=await userhelper.getcartList(req.body.userid)
  // console.log(productsss)
  console.log(orders)
  res.render('User/order',{admin:false,orders,user:req.session.user})
}),
router.get('/view-order-product/:id',async(req, res, next)=>{
  console.log(req.params.id)
  let products=await userhelper.getOrderProducts(req.params.id)
  console.log(products)
  res.render('User/view-order-product',{admin:false,products,user:req.session.user})
}),
router.post('/removeproduct',(req,res,next)=>{
  userhelper.removeitem(req.body).then((response)=>{
    res.json(response)
  })
}),
router.post('/varifypay',(req,res,next)=>{
res.render('User/payment-success',{admin:false})
})


router.get('/aboutus',(req,res,next)=>{
  // async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

main().catch(console.error);

res.render('User/aboutus',{admin:false})
})
router.get('/userinfo',varify,async(req,res)=>{
  console.log(req.session.user._id)
  let user=await userhelper.getuser(req.session.user._id)
  console.log(user)
  res.render('User/userinfo',{admin:false,user,user:req.session.user})
}),
module.exports = router;