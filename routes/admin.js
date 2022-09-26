const { response } = require('express');
var express = require('express');
const { routes } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const { deleteProducts } = require('../helpers/product-helpers');
var router = express.Router();
var producthelper= require('../helpers/product-helpers')
/* GET users listing. */
router.get('/alogin',function(req,res){
  res.render('Admin/alogin',{admin:true})

});
router.get('/orderdetails',function(req,res){
 
  producthelper.getallorders().then((orders)=>{
    res.render('Admin/orderdetails',{admin:false,orders});
    
 

})
});
router.get('/shippingdetails',function(req,res){
 
  producthelper.getallorders().then((orders)=>{
    res.render('Admin/shippingdetails',{admin:false,orders});
    
 

})
});

// router.get('/asignup',function(req,res){
//   res.render('Admin/asignup',{admin:true})

// })
// router.post('/asignup',(req,res)=>{
//   producthelper.doaSignup(req.body).then((response)=>{
//     res.redirect('/admin/alogin')            
//   })
// });
router.post('/alogin',(req,res)=>
{
  producthelper.doaLogin(req.body).then((response)=>{
    if(response.status)
    {
    
     res.redirect('/')
    }
    else{
     
  res.redirect('/')
    }
  })
});
router.get('/', function(req, res, next) {
  producthelper.getallProducts().then((products)=>{
    console.log(products)
    res.render('Admin/view-products',{admin:true,products});
  }) 
});
router.get('/add-products',function(req,res){
  res.render('Admin/add-products',{admin:true});
});
router.post('/add-products',(req,res)=>
{
  
  producthelper.addproducts(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err)
      {
        res.redirect('/admin/')
      }
      else
      {
        console.log(err);
      }
    })
   
  });

})
router.get('/delete-product/:id',function(req,res){
  var prid=req.params.id;
  console.log(prid);
  productHelpers.deleteProducts(prid).then((response)=>{
    res.redirect('/admin')
  })
  
});
router.get('/edit-product/:id',async function(req, res){
  let product=await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render('Admin/edit-products',{product})
})
router.post('/edit-products/:id',function(req, res){
productHelpers.updateproduct(req.params.id,req.body).then(()=>{
res.redirect('/admin/')
if(req.files.image)
{
  let image=req.files.image
  image.mv('./public/product-images/'+req.params.id+'.jpg') 
}
})
})

// router.get('/aorders',async(req,res)=>{
//   let orders=await userhelper.getUserOrder(req.session.user._id)
//   res.render('User/order',{admin:false,orders,user:req.session.user})
// }),
router.get('/userdetails',async function(req,res){
 
 let user=await productHelpers.getalluser()
console.log(user)
res.render('Admin/userdetails',{admin:true,user})

});
router.get('/delete-user/:id',function(req,res){
  var prid=req.params.id;
  console.log(prid);
  productHelpers.deleteuser(prid).then((response)=>{
    res.redirect('admin/userdetails')
  })
  
});
module.exports = router;
