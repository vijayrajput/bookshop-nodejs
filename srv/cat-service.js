/**
 * Implementation for CatalogService defined in ./cat-service.cds
 */

const cds = require('@sap/cds')

module.exports = async function () {

  // Use reflection to get the csn definition of CatalogService Entities
  const {Books,Persons,Orders} = this.entities

  // get DB Service
  const dbSrv = await cds.connect.to('db')

  //Get ExteA_BUSINESS,,,rnal Service
  const bupaSrv = await cds.connect.to('API_BUSINESS_PARTNER')

  // Add some discount for overstocked books
  this.after ('READ', Books, each=>{
    if (each.stock > 111) each.title += ' -- 11% discount!'
  })
   // Read Business Partner from External Service filter with Type = 0
  this.before('READ', Persons,  async (req)=> bupaSrv.tx(req).run(req.query.where({Type:'0'}))) 

  // Consume BupaSrv Event
  bupaSrv.on('BusinessPartner/Changed',async msg=> console.log('<<<< Message Consumed for BP:',msg.data.KEY[0].BUSINESSPARTNER))
  //    console.log(req.query)
   //   let inputQuery = req.query
    //  return bupaSrv.tx(req).run(req.query);
  //SELECT.from(Persons).where({BusinessPartnerCategory:'0'})
  
  // Reduce stock of books upon incoming orders
  this.before ('CREATE',Orders, async (req)=>{
    const tx = dbSrv.transaction(req), order = req.data;
    if (order.Items) {
      const affectedRows = await tx.run(order.Items.map(item =>
        UPDATE(Books) .where({ID:item.book_ID})
          .and(`stock >=`, item.amount)
          .set(`stock -=`, item.amount)
        )
      )
      if (affectedRows.some(row => !row)) req.error(409, 'Sold out, sorry')
    }
  })

  

}