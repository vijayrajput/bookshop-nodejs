/**
 * Implementation for CatalogService defined in ./cat-service.cds
 */

const cds = require('@sap/cds')

module.exports = async function () {

  // Use reflection to get the csn definition of CatalogService Entities
  const {Books,BusinessPartners,Orders} = this.entities

  // get DB Service
  const dbSrv = await cds.connect.to('db')

  //Get External Service
  const bupaSrv = await cds.connect.to('API_BUSINESS_PARTNER')

  // Add some discount for overstocked books
  this.after ('READ', Books, each=>{
    if (each.stock > 111) each.title += ' -- 11% discount!'
  })
   // Read Business Partner from External Service
  this.on('READ', BusinessPartners, async (req) => bupaSrv.tx(req).run(req.query))
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