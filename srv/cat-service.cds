using { sap.capire.bookshop as my } from '../db/schema';
using {API_BUSINESS_PARTNER as external} from './external/API_BUSINESS_PARTNER';

service CatalogService @(path:'/browse') {

  @readonly entity Books as SELECT from my.Books {*,
    author.name as author
  } excluding { createdBy, modifiedBy, status } where Books.status='Active' ;

  @readonly entity Persons as projection on external.A_BusinessPartner {
      key BusinessPartner as ID,
      FirstName,
      MiddleName,
      LastName,
      BusinessPartnerCategory as Type
  }   ;

  @requires_: 'authenticated-user'
  @insertonly entity Orders as projection on my.Orders;
}