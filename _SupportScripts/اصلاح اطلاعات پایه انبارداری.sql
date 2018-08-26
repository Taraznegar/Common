--select top 5 * 
--from AppFrameworkHanaDB.dbo.wm_ReferenceDocTypes 
--where IsUserDefined = 0 
--	--and RefDocName not in ('AmaniReturnFromSales', 'AmaniSalesProformaInvoice',
--	--	'FaktoreKharideDakheli', 'FaktoreKharideKhareji', 'GhetehBardariAzKala',
--	--	'ReturnFromBuy', 'ReturnFromSales', 'SalesProformaInvoice')
--order by RefDocName

--select top 100 * 
--from AppFrameworkDevDB.dbo.wm_ReferenceDocTypes 
--where IsUserDefined = 0 
--	--and RefDocName not in ('AmaniReturnFromSales', 'AmaniSalesProformaInvoice',
--	--	'FaktoreKharideDakheli', 'FaktoreKharideKhareji', 'GhetehBardariAzKala',
--	--	'ReturnFromBuy', 'ReturnFromSales', 'SalesProformaInvoice')
--order by RefDocName

if (exists(select 1 from wm_ReferenceDocTypes where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E08'))
	update wm_ReferenceDocTypes
	set RefDocName = 'AmaniReturnFromSales', 
		Title = N'برگشت کالای امانی ما نزد دیگران', 
		DataListFullName = 'ps.ReturnFromSaleList', 
		RefDocTableName = 'ps_ReturnFromSales', 
		EntityCaptionFieldName = 'ReturnFromSalesNumber', 
		RefDocEntityDefName = 'ps.ReturnFromSales', 
		RefDocItemsEntityDefName = 'ps.ReturnFromSaleItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 0, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'ps_ReturnFromSaleItems', 
		DataListMode = 'AmaniReturnFromSalesLookup', 
		RefDocFieldName = 'RefDoc_ReturnFromSale', 
		RefDocTarafHesabPersonFieldname = 'Customer'
	where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E08'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('8BD018BB-2897-459C-BF3E-9F0B27135E08', 'AmaniReturnFromSales', N'برگشت کالای امانی ما نزد دیگران', 
		'ps.ReturnFromSaleList', 'ps_ReturnFromSales', 'ReturnFromSalesNumber', 'ps.ReturnFromSales', 'ps.ReturnFromSaleItem', 0, 0, 1,
		'ps_ReturnFromSaleItems', 'AmaniReturnFromSalesLookup', 'RefDoc_ReturnFromSale', 'Customer')
		
if (exists(select 1 from wm_ReferenceDocTypes where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A1'))
	update wm_ReferenceDocTypes
	set RefDocName = 'AmaniSalesProformaInvoice', 
		Title = N'پیش فاکتور امانت کالا به دیگران', 
		DataListFullName = 'ps.SalesProformaInvoices', 
		RefDocTableName = 'ps_SalesInvoices', 
		EntityCaptionFieldName = 'InvoiceNumber', 
		RefDocEntityDefName = 'ps.SalesInvoice', 
		RefDocItemsEntityDefName = 'ps.SalesInvoiceItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 0,
		RefDocItemTableName = 'ps_SalesInvoiceItems', 
		DataListMode = 'AmaniSalesProformaInvoiceLookup', 
		RefDocFieldName = 'RefDoc_SalesInvoice', 
		RefDocTarafHesabPersonFieldname = 'Customer'
	where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A1'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('550A7D5C-D9DD-4519-A893-6D3B526836A1', 'AmaniSalesProformaInvoice', N'پیش فاکتور امانت کالا به دیگران', 
		'ps.SalesProformaInvoices', 'ps_SalesInvoices', 'InvoiceNumber', 'ps.SalesInvoice', 'ps.SalesInvoiceItem', 0, 1, 0,
		'ps_SalesInvoiceItems', 'AmaniSalesProformaInvoiceLookup', 'RefDoc_SalesInvoice', 'Customer')

if (exists(select 1 from wm_ReferenceDocTypes where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E07'))
	update wm_ReferenceDocTypes
	set RefDocName = 'FaktoreKharideDakheli', 
		Title = N'فاکتور خرید داخلی', 
		DataListFullName = 'ps.BuyInvoiceList', 
		RefDocTableName = 'ps_BuyInvoices', 
		EntityCaptionFieldName = 'InvoiceNumber', 
		RefDocEntityDefName = 'ps.BuyInvoice', 
		RefDocItemsEntityDefName = 'ps.BuyInvoiceItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 0, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'ps_BuyInvoiceItems', 
		DataListMode = 'BuyInvoiceLookup', 
		RefDocFieldName = 'RefDoc_BuyInvoice', 
		RefDocTarafHesabPersonFieldname = 'Seller'
	where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E07'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('8BD018BB-2897-459C-BF3E-9F0B27135E07', 'FaktoreKharideDakheli', N'فاکتور خرید داخلی', 
		'ps.BuyInvoiceList', 'ps_BuyInvoices', 'InvoiceNumber', 'ps.BuyInvoice', 'ps.BuyInvoiceItem', 0, 0, 1,
		'ps_BuyInvoiceItems', 'BuyInvoiceLookup', 'RefDoc_BuyInvoice', 'Seller')

if (exists(select 1 from wm_ReferenceDocTypes where ID = 'C23363B3-DD07-4215-A190-7D0BB396C871'))
	update wm_ReferenceDocTypes
	set RefDocName = 'FaktoreKharideKhareji', 
		Title = N'فاکتور خرید خارجی', 
		DataListFullName = 'ps.BuyInvoiceList', 
		RefDocTableName = 'ps_BuyInvoices', 
		EntityCaptionFieldName = 'InvoiceNumber', 
		RefDocEntityDefName = 'ps.BuyInvoice', 
		RefDocItemsEntityDefName = 'ps.BuyInvoiceItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 0, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'ps_BuyInvoiceItems', 
		DataListMode = 'BuyInvoiceLookup', 
		RefDocFieldName = 'RefDoc_BuyInvoice', 
		RefDocTarafHesabPersonFieldname = 'Seller'
	where ID = 'C23363B3-DD07-4215-A190-7D0BB396C871'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('C23363B3-DD07-4215-A190-7D0BB396C871', 'FaktoreKharideKhareji', N'فاکتور خرید خارجی', 
		'ps.BuyInvoiceList', 'ps_BuyInvoices', 'InvoiceNumber', 'ps.BuyInvoice', 'ps.BuyInvoiceItem', 0, 0, 1,
		'ps_BuyInvoiceItems', 'BuyInvoiceLookup', 'RefDoc_BuyInvoice', 'Seller')

if (exists(select 1 from wm_ReferenceDocTypes where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E09'))
	update wm_ReferenceDocTypes
	set RefDocName = 'GhetehBardariAzKala', 
		Title = N'قطعه برداری از کالا', 
		DataListFullName = 'wm.GhetehBardariAzKalaList', 
		RefDocTableName = 'wm_GhetehBardariAzKalaha', 
		EntityCaptionFieldName = 'OpNumber', 
		RefDocEntityDefName = 'wm.GhetehBardariAzKala', 
		RefDocItemsEntityDefName = 'wm.GhetehBardariAzKalaItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'wm_GhetehBardariAzKalaItems', 
		DataListMode = null, 
		RefDocFieldName = 'RefDoc_GhetehBardariAzKala', 
		RefDocTarafHesabPersonFieldname = null
	where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E09'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('8BD018BB-2897-459C-BF3E-9F0B27135E09', 'GhetehBardariAzKala', N'قطعه برداری از کالا', 
		'wm.GhetehBardariAzKalaList', 'wm_GhetehBardariAzKalaha', 'OpNumber', 'wm.GhetehBardariAzKala', 'wm.GhetehBardariAzKalaItem', 0, 1, 1,
		'wm_GhetehBardariAzKalaItems', null, 'RefDoc_GhetehBardariAzKala', null)


if (exists(select 1 from wm_ReferenceDocTypes where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A2'))
	update wm_ReferenceDocTypes
	set RefDocName = 'ReturnFromBuy', 
		Title = N'برگشت از خرید', 
		DataListFullName = 'ps.ReturnFromBuyList', 
		RefDocTableName = 'ps_ReturnFromBuys', 
		EntityCaptionFieldName = 'ReturnFromBuyNumber', 
		RefDocEntityDefName = 'ps.ReturnFromBuy', 
		RefDocItemsEntityDefName = 'ps.ReturnFromBuyItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 0,
		RefDocItemTableName = 'ps_ReturnFromBuyItems', 
		DataListMode = 'ReturnFromBuyLookup', 
		RefDocFieldName = 'RefDoc_ReturnFromBuy', 
		RefDocTarafHesabPersonFieldname = 'Seller'
	where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A2'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('550A7D5C-D9DD-4519-A893-6D3B526836A2', 'ReturnFromBuy', N'برگشت از خرید', 
		'ps.ReturnFromBuyList', 'ps_ReturnFromBuys', 'ReturnFromBuyNumber', 'ps.ReturnFromBuy', 'ps.ReturnFromBuyItem', 0, 1, 0,
		'ps_ReturnFromBuyItems', 'ReturnFromBuyLookup', 'RefDoc_ReturnFromBuy', 'Seller')

if (exists(select 1 from wm_ReferenceDocTypes where ID = 'CA51C4CB-FCF4-4810-AD5C-2D1FFCEB1387'))
	update wm_ReferenceDocTypes
	set RefDocName = 'ReturnFromSales', 
		Title = N'برگشت از فروش', 
		DataListFullName = 'ps.ReturnFromSaleList', 
		RefDocTableName = 'ps_ReturnFromSales', 
		EntityCaptionFieldName = 'ReturnFromSalesNumber', 
		RefDocEntityDefName = 'ps.ReturnFromSales', 
		RefDocItemsEntityDefName = 'ps.ReturnFromSaleItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 0, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'ps_ReturnFromSaleItems', 
		DataListMode = 'ReturnFromSalesLookup', 
		RefDocFieldName = 'RefDoc_ReturnFromSale', 
		RefDocTarafHesabPersonFieldname = 'Customer'
	where ID = 'CA51C4CB-FCF4-4810-AD5C-2D1FFCEB1387'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('CA51C4CB-FCF4-4810-AD5C-2D1FFCEB1387', 'ReturnFromSales', N'برگشت از فروش', 
		'ps.ReturnFromSaleList', 'ps_ReturnFromSales', 'ReturnFromSalesNumber', 'ps.ReturnFromSales', 'ps.ReturnFromSaleItem', 0, 0, 1,
		'ps_ReturnFromSaleItems', 'ReturnFromSalesLookup', 'RefDoc_ReturnFromSale', 'Customer')

if (exists(select 1 from wm_ReferenceDocTypes where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A0'))
	update wm_ReferenceDocTypes
	set RefDocName = 'SalesProformaInvoice', 
		Title = N'پیش فاکتور فروش', 
		DataListFullName = 'ps.SalesProformaInvoices', 
		RefDocTableName = 'ps_SalesInvoices', 
		EntityCaptionFieldName = 'InvoiceNumber', 
		RefDocEntityDefName = 'ps.SalesInvoice', 
		RefDocItemsEntityDefName = 'ps.SalesInvoiceItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 0,
		RefDocItemTableName = 'ps_SalesInvoiceItems', 
		DataListMode = 'SalesProformaInvoiceLookup', 
		RefDocFieldName = 'RefDoc_SalesInvoice', 
		RefDocTarafHesabPersonFieldname = 'Customer'
	where ID = '550A7D5C-D9DD-4519-A893-6D3B526836A0'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('550A7D5C-D9DD-4519-A893-6D3B526836A0', 'SalesProformaInvoice', N'پیش فاکتور فروش', 
		'ps.SalesProformaInvoices', 'ps_SalesInvoices', 'InvoiceNumber', 'ps.SalesInvoice', 'ps.SalesInvoiceItem', 0, 1, 0,
		'ps_SalesInvoiceItems', 'SalesProformaInvoiceLookup', 'RefDoc_SalesInvoice', 'Customer')

if (exists(select 1 from wm_ReferenceDocTypes where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E06'))
	update wm_ReferenceDocTypes
	set RefDocName = 'StuffStatusChangeAndTransfer', 
		Title = N'تغییر وضعیت و انتقال کالا', 
		DataListFullName = 'wm.StuffStatusChangeAndTransferList', 
		RefDocTableName = 'wm_StuffStatusChangeAndTransfers', 
		EntityCaptionFieldName = 'OpNumber', 
		RefDocEntityDefName = 'wm.StuffStatusChangeAndTransfer', 
		RefDocItemsEntityDefName = 'wm.StuffStatusChangeAndTransferItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'wm_StuffStatusChangeAndTransferItems', 
		DataListMode = null, 
		RefDocFieldName = 'RefDoc_StuffStatusChangeAndTransfer', 
		RefDocTarafHesabPersonFieldname = null
	where ID = '8BD018BB-2897-459C-BF3E-9F0B27135E06'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('8BD018BB-2897-459C-BF3E-9F0B27135E06', 'StuffStatusChangeAndTransfer', N'تغییر وضعیت و انتقال کالا', 
		'wm.StuffStatusChangeAndTransferList', 'wm_StuffStatusChangeAndTransfers', 'OpNumber', 'wm.StuffStatusChangeAndTransfer', 'wm.StuffStatusChangeAndTransferItem', 0, 1, 1,
		'wm_StuffStatusChangeAndTransferItems', null, 'RefDoc_StuffStatusChangeAndTransfer', null)

if (exists(select 1 from wm_ReferenceDocTypes where ID = '5016CBCF-22E9-4A21-8175-E5B27C6FE496'))
	update wm_ReferenceDocTypes
	set RefDocName = 'WarehouseHybridOperation', 
		Title = N'عملیات ترکیبی', 
		DataListFullName = 'wm.WarehouseHybridOperations', 
		RefDocTableName = 'wm_WarehouseHybridOperations', 
		EntityCaptionFieldName = 'OpNumber', 
		RefDocEntityDefName = 'wm.WarehouseHybridOperation', 
		RefDocItemsEntityDefName = 'wm.WarehouseHybridOperationItem', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'wm_WarehouseHybridOperationItems', 
		DataListMode = null, 
		RefDocFieldName = 'RefDoc_WarehouseHybridOperation', 
		RefDocTarafHesabPersonFieldname = null
	where ID = '5016CBCF-22E9-4A21-8175-E5B27C6FE496'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('5016CBCF-22E9-4A21-8175-E5B27C6FE496', 'WarehouseHybridOperation', N'عملیات ترکیبی', 
		'wm.WarehouseHybridOperations', 'wm_WarehouseHybridOperations', 'OpNumber', 'wm.WarehouseHybridOperation', 'wm.WarehouseHybridOperationItem', 0, 1, 1,
		'wm_WarehouseHybridOperationItems', null, 'RefDoc_WarehouseHybridOperation', null)

if (exists(select 1 from wm_ReferenceDocTypes where ID = 'EA979621-3CFE-4FE1-AECF-723F5779A577'))
	update wm_ReferenceDocTypes
	set RefDocName = 'MontageOp', 
		Title = N'عملیات مونتاژ', 
		DataListFullName = 'wm.MontageOrDemontageList', 
		RefDocTableName = 'wm_MontageOrDemontages', 
		EntityCaptionFieldName = 'OpNumber', 
		RefDocEntityDefName = 'wm.MontageOrDemontage', 
		RefDocItemsEntityDefName = 'wm.MontageOrDemontageStuffComponent', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'wm_MontageOrDemontages', 
		DataListMode = 'Montage', 
		RefDocFieldName ='RefDoc_MontageOp' , 
		RefDocTarafHesabPersonFieldname = null
	where ID = 'EA979621-3CFE-4FE1-AECF-723F5779A577'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('EA979621-3CFE-4FE1-AECF-723F5779A577', 'MontageOp', N'عملیات مونتاژ', 
		'wm.MontageOrDemontageList', 'wm_MontageOrDemontages', 'OpNumber', 'wm.MontageOrDemontage', 'wm.MontageOrDemontageStuffComponent', 0, 1, 1,
		'wm_MontageOrDemontages', 'Montage', 'RefDoc_MontageOp', null)

if (exists(select 1 from wm_ReferenceDocTypes where ID = '699D9996-682F-457A-8865-F7B7E5141140'))
	update wm_ReferenceDocTypes
	set RefDocName = 'DemontageOp', 
		Title = N'عملیات دمونتاژ', 
		DataListFullName = 'wm.MontageOrDemontageList', 
		RefDocTableName = 'wm_MontageOrDemontages', 
		EntityCaptionFieldName = 'OpNumber', 
		RefDocEntityDefName = 'wm.MontageOrDemontage', 
		RefDocItemsEntityDefName = 'wm.MontageOrDemontageStuffComponent', 
		IsUserDefined = 0, 
		EmkaneSodoreHavaleKhoroj = 1, 
		EmkaneSodoreGhabzVorod = 1,
		RefDocItemTableName = 'wm_MontageOrDemontages', 
		DataListMode = 'Demontage', 
		RefDocFieldName = 'RefDoc_DemontageOp', 
		RefDocTarafHesabPersonFieldname = null
	where ID = '699D9996-682F-457A-8865-F7B7E5141140'
else
	insert into wm_ReferenceDocTypes (ID, RefDocName, Title, 
		DataListFullName, RefDocTableName, EntityCaptionFieldName, RefDocEntityDefName, RefDocItemsEntityDefName, IsUserDefined, EmkaneSodoreHavaleKhoroj, EmkaneSodoreGhabzVorod,
		RefDocItemTableName, DataListMode, RefDocFieldName, RefDocTarafHesabPersonFieldname)
	values ('699D9996-682F-457A-8865-F7B7E5141140', 'DemontageOp', N'عملیات دمونتاژ', 
		'wm.MontageOrDemontageList', 'wm_MontageOrDemontages', 'OpNumber', 'wm.MontageOrDemontage', 'wm.MontageOrDemontageStuffComponent', 0, 1, 1,
		'wm_MontageOrDemontages', 'Demontage', 'RefDoc_DemontageOp', null)


update wm_GhabzOrHavaleTypes set Name = 'ReturnFromSalesGhabz' where Name = 'ReturnFromSalesHavale'

select * from wm_ReferenceDocTypes