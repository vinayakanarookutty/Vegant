function addtocart(proid){
    $.ajax({
      url:'/add-to-cart/'+proid,
      method:'get',
      success:(response)=>{
        if(response.status)
        {
            console.log("sett")
          let count=$('#cart-count').html()
          count=parseInt(count)+1
          $("#cart-count").html(count)
        }
        console.log("podayjgjhkgkjhgjhk")
      },
      error:()=>{
        console.log(error)
      }
    })
}