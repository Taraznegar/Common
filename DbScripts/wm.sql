if(exists(select 1 from sys.views where name = 'wm_StockStuffInStuffLocationView'))
	drop view wm_StockStuffInStuffLocationView
go

if(exists(select 1 from sys.views where name = 'wm_StuffsStockInStuffLocationView'))
	drop view wm_StuffsStockInStuffLocationView
go

if not exists (select 1 from sys.indexes where name = 'IX_wm_GhabzOrHavaleha_VazeyatRialiShodan__GhabzOrHavaleType__IssueDate')
	create index IX_wm_GhabzOrHavaleha_VazeyatRialiShodan__GhabzOrHavaleType__IssueDate on wm_GhabzOrHavaleha(VazeyatRialiShodan, GhabzOrHavaleType, IssueDate)
go
	
if not exists (select 1 from sys.indexes where name = 'IX_wm_GhabzOrHavaleItems_GhabzOrHavale')
	create index IX_wm_GhabzOrHavaleItems_GhabzOrHavale on wm_GhabzOrHavaleItems(GhabzOrHavale)
go

if not exists (select 1 from sys.indexes where name = 'IX_wm_GhabzOrHavaleha_IssueDate')
	create index IX_wm_GhabzOrHavaleha_IssueDate on wm_GhabzOrHavaleha(IssueDate)
go

afw.BeforeAlterView 'wm_GhabzOrHavalehaView'
go
alter view wm_GhabzOrHavalehaView as
	select GhabzOrHavale.*,
		StuffLocation.Name StuffLocation_Name,
		GhabzOrHavaleType.Title GhabzOrHavaleType_Title,
		ReferenceDocType.Title ReferenceDocType_Title,
		FinancialYear.YearNo FinancialYear_YearNo,
		OrgUnit.Name OrgUnit_Name,
		GhabzOrHavaleType.WarehouseDocType,
		GhabzOrHavaleType.NahveRialiNemodan,
		WarehouseDocType.Name WarehouseDocType_Name,
		WarehouseDocType.Title WarehouseDocType_Title,
		FinancialDocType.Title FinancialDocType_Title,
		VazeyatRialiShodan.Title VazeyatRialiShodan_Title
	from wm_GhabzOrHavaleha GhabzOrHavale
		left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
		left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
		left join wm_ReferenceDocTypes ReferenceDocType on ReferenceDocType.ID = GhabzOrHavale.ReferenceDocType
		left join cmn_FinancialYears FinancialYear on FinancialYear.ID = GhabzOrHavale.FinancialYear
		left join cmn_OrganizationInformations OrgUnit on OrgUnit.ID = GhabzOrHavale.OrganizationUnit
		left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType 
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = GhabzOrHavale.FinancialDocType
		left join afw_OptionSetItems VazeyatRialiShodan on VazeyatRialiShodan.ID = GhabzOrHavale.VazeyatRialiShodan  
go

afw.BeforeAlterView 'wm_GhabzOrHavaleItemsView'
go
alter view wm_GhabzOrHavaleItemsView as
	select GhabzOrHavaleItem.*,
		StuffStatus.Title StuffStatus_Title,
		Stuff.StuffDef
	from wm_GhabzOrHavaleItems GhabzOrHavaleItem
		left join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
		left join cmn_Stuffs Stuff on Stuff.ID = GhabzOrHavaleItem.Stuff
go

afw.BeforeAlterSF 'wm.GetStuffRealStock'
go
alter function wm.GetStuffRealStock
(
	@Stuff uniqueidentifier,
	@StuffLocation uniqueidentifier,
	@StuffStatus uniqueidentifier,
	@BatchNumber nvarchar(50),
	@IssueDate datetime,
	@CreationTime datetime) returns bigint as
begin
	declare @Stock bigint
	declare @ErrorInt int

	if (@CreationTime is not null and @IssueDate is null)
		set @ErrorInt = CAST('*** Error in wm.GetStuffRealStock: CreationTime parameter is set but IssueDate parameter is not set. ***' as int)

	select @Stock = sum(case when WarehouseDocType.Name = 'Ghabz' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end)
	from wm_GhabzOrHavaleItems GhabzOrHavaleItem
		left join cmn_Stuffs Stuff on Stuff.ID = GhabzOrHavaleItem.Stuff
		left join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
		left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
		left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
	where GhabzOrHavaleItem.Stuff = @Stuff
		and (@StuffLocation is null or GhabzOrHavale.StuffLocation = @StuffLocation)
		and (@StuffStatus is null or GhabzOrHavaleItem.StuffStatus = @StuffStatus)
		and (@BatchNumber is null or GhabzOrHavaleItem.BatchNumber = @BatchNumber)
		and (@IssueDate is null or GhabzOrHavale.IssueDate <= @IssueDate)
		and (@CreationTime is null or GhabzOrHavale.CreationTime <= @CreationTime 
			or GhabzOrHavale.IssueDate < @IssueDate)

	return isnull(@Stock, 0)
end
go

afw.BeforeAlterView 'wm_HavaleListView'
go
alter view wm_HavaleListView as
	select GhabzOrHavale.ID,
		GhabzOrHavale.CreationTime,
		GhabzOrHavale.Havale_ShomarehBarnameh,
		GhabzOrHavale.GhabzOrHavaleType,
		GhabzOrHavaleType.Title GhabzOrHavaleType_Text,
		GhabzOrHavaleType.WareHouseDocType,
		GhabzOrHavale.FinancialYear,
		GhabzOrHavale.Stufflocation,
		StuffLocation.Name StuffLocation_Text, 
		GhabzOrHavale.ReferenceDocType,
		ReferenceDocType.Title ReferenceDocType_Text,
		case when ReferenceDocType.RefDocName is null or  GhabzOrHavale.ManualReferenceDocNumber is not null then GhabzOrHavale.ManualReferenceDocNumber
			when ReferenceDocType.RefDocName = 'SalesProformaInvoice' then SalesInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'AmaniSalesProformaInvoice' then SalesInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'BuyInvoice' then BuyInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'ReturnFromSale' then ReturnFromSale.ReturnFromSalesNumber
			when ReferenceDocType.RefDocName = 'AmaniReturnFromSales' then ReturnFromSale.ReturnFromSalesNumber
			when ReferenceDocType.RefDocName = 'ReturnFromBuy' then ReturnFromBuy.ReturnFromBuyNumber
			when ReferenceDocType.RefDocName = 'GhetehBardariAzKala' then GhetehBardariAzKala.OpNumber
			when ReferenceDocType.RefDocName = 'StuffStatusChangeAndTransfer' then StuffStatusChangeAndTransfer.OpNumber
			when ReferenceDocType.RefDocName = 'WarehouseHybridOperation' then cast(WarehouseHybridOperation.OpNumber as varchar(50))
			when ReferenceDocType.RefDocName in ('MontageOp', 'DemontageOp') then cast(MontageOrDemontageOp.OpNumber as varchar(50))
		end ReferenceDocNumber, 
		WareHouseDocType.Name GHTypeName, 
		WareHouseDocType.Title GHTypeTitle,
		GhabzOrHavale.TarafHesab_Person,
		TarafHesab_Person.StoredDisplayText TarafHesab_Person_DisplayName,
		TarafHesab_Account.Name TarafHesab_Account_DisplayName,
		TarafHesab_Project.Name TarafHesab_Project_DisplayName, 
		TarafHesab_CostCenter.Name TarafHesab_CostCenter_DisplayName,
		TarafHesab_ForeignCurrency.Name TarafHesab_ForeignCurrency_DisplayName,
		GhabzOrHavale.GhabzOrHavaleNumber,
		case when GhabzOrHavale.SerialNumbersAreSet = 0 then N'ناقص'
			else N' ' 
		end SerialNumbersEntryStatus,
		GhabzOrHavale.FinancialDocType,
		FinancialDocType.Title FinancialDocType_DisplayName,
		GhabzOrHavale.OrganizationUnit,
		OrgUnit.Name OrgUnit_DisplayName,
		FinancialYear.YearNo,
		cast(GhabzOrHavale.IssueDate as date) IssueDate,
		afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_Text,
		case when LEN(GhabzOrHavale.WarehouseKeeperNotes) < 97 then GhabzOrHavale.WarehouseKeeperNotes
			else substring(GhabzOrHavale.WarehouseKeeperNotes, 1, 97) + N'...' end WarehouseKeeperNotes_PreviewText
	from wm_GhabzOrHavaleha GhabzOrHavale
		left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
		left join wm_ReferenceDocTypes ReferenceDocType on ReferenceDocType.ID = GhabzOrHavale.ReferenceDocType
		left join afw_OptionSetItems WareHouseDocType on WareHouseDocType.ID = GhabzOrHavaleType.WareHouseDocType
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = GhabzOrHavale.FinancialDocType
		left join cmn_FinancialYears FinancialYear on FinancialYear.ID = GhabzOrHavale.FinancialYear
		left join cmn_OrganizationInformations OrgUnit on OrgUnit.ID = GhabzOrHavale.OrganizationUnit
		left join acc_Accounts TarafHesab_Account on TarafHesab_Account.ID = GhabzOrHavale.TarafHesab_Account
		left join cmn_Persons TarafHesab_Person on TarafHesab_Person.ID = GhabzOrHavale.TarafHesab_Person
		left join cmn_Projects TarafHesab_Project on TarafHesab_Project.ID = GhabzOrHavale.TarafHesab_Project
		left join cmn_CostCenters TarafHesab_CostCenter on TarafHesab_CostCenter.ID = GhabzOrHavale.TarafHesab_CostCenter
		left join cmn_ForeignCurrencies TarafHesab_ForeignCurrency on TarafHesab_ForeignCurrency.ID = GhabzOrHavale.TarafHesab_ForeignCurrency
		left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
		left join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = GhabzOrHavale.RefDoc_SalesInvoice
		left join ps_ReturnFromSales ReturnFromSale on ReturnFromSale.ID = GhabzOrHavale.RefDoc_ReturnFromSale
		left join ps_ReturnFromBuys ReturnFromBuy on ReturnFromBuy.ID = GhabzOrHavale.RefDoc_ReturnFromBuy
		left join ps_BuyInvoices BuyInvoice on BuyInvoice.ID = GhabzOrHavale.RefDoc_BuyInvoice
		left join wm_GhetehBardariAzKalaha GhetehBardariAzKala on GhetehBardariAzKala.ID = GhabzOrHavale.RefDoc_GhetehBardariAzKala
		left join wm_StuffStatusChangeAndTransfers StuffStatusChangeAndTransfer on StuffStatusChangeAndTransfer.ID = GhabzOrHavale.RefDoc_StuffStatusChangeAndTransfer
		left join wm_WarehouseHybridOperations WarehouseHybridOperation on WarehouseHybridOperation.ID = GhabzOrHavale.RefDoc_WarehouseHybridOperation
		left join wm_MontageOrDemontages MontageOrDemontageOp on MontageOrDemontageOp.ID in (GhabzOrHavale.RefDoc_MontageOp, GhabzOrHavale.RefDoc_DemontageOp)
	where WareHouseDocType.Name = N'Havale'
go

afw.BeforeAlterView 'wm_GhabzListView'
go
alter view wm_GhabzListView as
	select GhabzOrHavale.ID,
		GhabzOrHavale.CreationTime,
		GhabzOrHavale.GhabzOrHavaleType,
		GhabzOrHavaleType.Title GhabzOrHavaleType_Text,
		GhabzOrHavaleType.WarehouseDocType,
		GhabzOrHavale.FinancialYear,
		GhabzOrHavale.Stufflocation,
		StuffLocation.Name StuffLocation_Text, 
		GhabzOrHavale.ReferenceDocType,
		ReferenceDocType.Title ReferenceDocType_Text,
		case when ReferenceDocType.RefDocName is null or  GhabzOrHavale.ManualReferenceDocNumber is not null then GhabzOrHavale.ManualReferenceDocNumber
			when ReferenceDocType.RefDocName = 'SalesProformaInvoice' then SalesInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'AmaniSalesProformaInvoice' then SalesInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'BuyInvoice' then BuyInvoice.InvoiceNumber
			when ReferenceDocType.RefDocName = 'ReturnFromSale' then ReturnFromSale.ReturnFromSalesNumber
			when ReferenceDocType.RefDocName = 'AmaniReturnFromSales' then ReturnFromSale.ReturnFromSalesNumber
			when ReferenceDocType.RefDocName = 'ReturnFromBuy' then ReturnFromBuy.ReturnFromBuyNumber
			when ReferenceDocType.RefDocName = 'GhetehBardariAzKala' then GhetehBardariAzKala.OpNumber
			when ReferenceDocType.RefDocName = 'StuffStatusChangeAndTransfer' then StuffStatusChangeAndTransfer.OpNumber
			when ReferenceDocType.RefDocName = 'WarehouseHybridOperation' then cast(WarehouseHybridOperation.OpNumber as varchar(50))
			when ReferenceDocType.RefDocName in ('MontageOp', 'DemontageOp') then cast(MontageOrDemontageOp.OpNumber as varchar(50))
		end ReferenceDocNumber, 
		GhabzOrHavale.TarafHesab_Person,
		TarafHesab_Person.StoredDisplayText TarafHesab_Person_DisplayName,
		WarehouseDocType.Name GHTypeName, 
		WarehouseDocType.Title GHTypeTitle,
		TarafHesab_Project.Name TarafHesab_Project_DisplayName, 
		TarafHesab_CostCenter.Name TarafHesab_CostCenter_DisplayName,
		TarafHesab_ForeignCurrency.Name TarafHesab_ForeignCurrency_DisplayName,
		GhabzOrHavale.GhabzOrHavaleNumber, 
		case when GhabzOrHavale.SerialNumbersAreSet = 0 then N'ناقص'
			else N' ' 
		end SerialNumbersEntryStatus,
		GhabzOrHavale.FinancialDocType,
		FinancialDocType.Title FinancialDocType_DisplayName,
		GhabzOrHavale.OrganizationUnit,
		OrgUnit.Name OrgUnit_DisplayName,
		FinancialYear.YearNo,
		cast(GhabzOrHavale.IssueDate as date) IssueDate,		
		afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_Text,
		case when LEN(GhabzOrHavale.WarehouseKeeperNotes) < 97 then GhabzOrHavale.WarehouseKeeperNotes
			else substring(GhabzOrHavale.WarehouseKeeperNotes, 1, 97) + N'...' end WarehouseKeeperNotes_PreviewText
	from wm_GhabzOrHavaleha GhabzOrHavale
		left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
		left join wm_ReferenceDocTypes ReferenceDocType on ReferenceDocType.ID = GhabzOrHavale.ReferenceDocType
		left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = GhabzOrHavale.FinancialDocType
		left join cmn_FinancialYears FinancialYear on FinancialYear.ID = GhabzOrHavale.FinancialYear
		left join cmn_OrganizationInformations OrgUnit on OrgUnit.ID = GhabzOrHavale.OrganizationUnit
		left join cmn_Persons TarafHesab_Person on TarafHesab_Person.ID = GhabzOrHavale.TarafHesab_Person
		left join cmn_Projects TarafHesab_Project on TarafHesab_Project.ID = GhabzOrHavale.TarafHesab_Project
		left join cmn_CostCenters TarafHesab_CostCenter on TarafHesab_CostCenter.ID = GhabzOrHavale.TarafHesab_CostCenter
		left join cmn_ForeignCurrencies TarafHesab_ForeignCurrency on TarafHesab_ForeignCurrency.ID = GhabzOrHavale.TarafHesab_ForeignCurrency
		left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
		left join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = GhabzOrHavale.RefDoc_SalesInvoice
		left join ps_ReturnFromSales ReturnFromSale on ReturnFromSale.ID = GhabzOrHavale.RefDoc_ReturnFromSale
		left join ps_ReturnFromBuys ReturnFromBuy on ReturnFromBuy.ID = GhabzOrHavale.RefDoc_ReturnFromBuy
		left join ps_BuyInvoices BuyInvoice on BuyInvoice.ID = GhabzOrHavale.RefDoc_BuyInvoice
		left join wm_GhetehBardariAzKalaha GhetehBardariAzKala on GhetehBardariAzKala.ID = GhabzOrHavale.RefDoc_GhetehBardariAzKala
		left join wm_StuffStatusChangeAndTransfers StuffStatusChangeAndTransfer on StuffStatusChangeAndTransfer.ID = GhabzOrHavale.RefDoc_StuffStatusChangeAndTransfer
		left join wm_WarehouseHybridOperations WarehouseHybridOperation on WarehouseHybridOperation.ID = GhabzOrHavale.RefDoc_WarehouseHybridOperation
		left join wm_MontageOrDemontages MontageOrDemontageOp on MontageOrDemontageOp.ID in (GhabzOrHavale.RefDoc_MontageOp, GhabzOrHavale.RefDoc_DemontageOp)
	where WarehouseDocType.Name = N'Ghabz'
go

afw.BeforeAlterView 'wm_HavaleRequestItemsView'
go
alter view wm_HavaleRequestItemsView as
	select SalesInvoiceItem.ID RefDocItemID,
		Proforma.ID RefDocID,
		SalesInvoiceItem.Stuff StuffID,
		StuffDef.Name StuffDefName,
		SalesInvoiceItem.Quantity,
		SalesInvoiceItem.UnitPrice,
		Proforma.InvoiceNumber ReferenceDocNumber,
		Proforma.RequestNumber,
		Proforma.OrganizationUnit,
		Proforma.FinancialDocType,
		Proforma.Customer Tarafhesab,
		Proforma.Customer TarafHesab_Person,
		(select FullName from cmn_PersonsLookUpView where ID = Proforma.Customer) TarafHesab_Person_Text,
		Proforma.IssueDate,
		afw.GregorianToPersian(Proforma.IssueDate) IssueDate_Text,
		Proforma.CreatorUser CreatorUser,
		CreatorUser.DisplayName CreatorUser_Name,
		OrganizationUnit.Name OrganizationUnit_Text,
		N'پیش فاکتور فروش' ReferenceDocTypeName,
		'SalesProfomaInvoice' RefDocName,
		(select cast(max(WorkflowStageChangeLog.CreationTime) as date)
				from ps_SalesInvoiceWorkflowStageChangeLogs WorkflowStageChangeLog 
			where WorkflowStageChangeLog.SalesInvoice = Proforma.ID 
				and WorkflowStage.ID = WorkflowStageChangeLog.NewWorkflowStage
		)RequestDateTime,
		(
			select afw.GregorianToPersian(max(WorkflowStageChangeLog.CreationTime)) 
				from ps_SalesInvoiceWorkflowStageChangeLogs WorkflowStageChangeLog 
			where WorkflowStageChangeLog.SalesInvoice = Proforma.ID 
				and WorkflowStage.ID = WorkflowStageChangeLog.NewWorkflowStage
		) RequestDateTime_Text
	from ps_SalesInvoiceItems SalesInvoiceItem
		left join ps_SalesInvoices Proforma on Proforma.ID = SalesInvoiceItem.SalesInvoice
		left join cmn_Stuffs Stuff on Stuff.ID = SalesInvoiceItem.Stuff
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = Proforma.CreatorUser
		left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = Proforma.OrganizationUnit	
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = Proforma.FinancialDocType
		left join afw_OptionSetItems HavaleIssuingStatus on HavaleIssuingStatus.ID = Proforma.HavaleIssuingStatus
		left join cmn_WorkflowStages WorkflowStage on WorkflowStage.ID = Proforma.WorkflowStage
	where Proforma.IsProforma = 1
		and Proforma.IsAmani = 0
		and WorkflowStage.LatinName = 'FinalApproved' 
		and HavaleIssuingStatus.Name = 'HavaleNashodeh'
		and not exists(select 1 from wm_GhabzOrHavaleha where RefDoc_SalesInvoice = Proforma.ID)
		and not exists(select 1 from ps_SalesInvoices where SourceProforma = Proforma.ID and IsProforma = 0)
		and SalesInvoiceItem.Service is null
	union
	select SalesInvoiceItem.ID RefDocItemID,
		Proforma.ID RefDocID,
		SalesInvoiceItem.Stuff StuffID,
		StuffDef.Name StuffDefName,
		SalesInvoiceItem.Quantity,
		SalesInvoiceItem.UnitPrice,
		Proforma.InvoiceNumber ReferenceDocNumber,
		Proforma.RequestNumber,
		Proforma.OrganizationUnit,
		Proforma.FinancialDocType,
		Proforma.Customer Tarafhesab,
		Proforma.Customer TarafHesab_Person,
		(select FullName from cmn_PersonsLookUpView where ID = Proforma.Customer) TarafHesab_Person_Text,
		Proforma.IssueDate,
		afw.GregorianToPersian(Proforma.IssueDate) IssueDate_Text,
		Proforma.CreatorUser CreatorUser,
		CreatorUser.DisplayName CreatorUser_Name,
		OrganizationUnit.Name OrganizationUnit_Text,
		N'پیش فاکتور امانی' ReferenceDocTypeName,
		'AmaniSalesProformaInvoice' RefDocName,
		cast(Proforma.CreationTime as date) RequestDateTime,
		afw.GregorianToPersian(Proforma.CreationTime) RequestDateTime_Text
	from ps_SalesInvoiceItems SalesInvoiceItem
		left join ps_SalesInvoices Proforma on Proforma.ID = SalesInvoiceItem.SalesInvoice
		left join cmn_Stuffs Stuff on Stuff.ID = SalesInvoiceItem.Stuff
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = Proforma.CreatorUser
		left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = Proforma.OrganizationUnit	
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = Proforma.FinancialDocType
		left join afw_OptionSetItems HavaleIssuingStatus on HavaleIssuingStatus.ID = Proforma.HavaleIssuingStatus
		left join cmn_WorkflowStages WorkflowStage on WorkflowStage.ID = Proforma.WorkflowStage
	where Proforma.IsProforma = 1 
		and Proforma.IsAmani = 1
		and WorkflowStage.LatinName = 'FinalApproved' 
		and HavaleIssuingStatus.Name = 'HavaleNashodeh'
		and not exists(select 1 from wm_GhabzOrHavaleha where RefDoc_SalesInvoice = Proforma.ID)
		and not exists(select 1 from ps_SalesInvoices where SourceProforma = Proforma.ID and IsProforma = 0)
		and SalesInvoiceItem.Service is null
	union
	select ReturnFromBuyItem.ID RefDocItemID,
		ReturnFromBuy.ID RefDocID,
		ReturnFromBuyItem.Stuff StuffID,
		StuffDef.Name StuffDefName,
		ReturnFromBuyItem.Quantity,
		ReturnFromBuyItem.UnitPrice,
		ReturnFromBuy.ReturnFromBuyNumber ReferenceDocNumber,
		null,
		ReturnFromBuy.OrganizationUnit,
		ReturnFromBuy.FinancialDocType,
		ReturnFromBuy.Seller Tarafhesab,
		ReturnFromBuy.Seller TarafHesab_Person,
		(select FullName from cmn_PersonsLookUpView where ID = ReturnFromBuy.Seller) TarafHesab_Person_Text,
		ReturnFromBuy.IssueDate,
		afw.GregorianToPersian(ReturnFromBuy.IssueDate) IssueDate_Text,
		ReturnFromBuy.CreatorUser CreatorUser,
		CreatorUser.DisplayName CreatorUser_Name,
		OrganizationUnit.Name OrganizationUnit_Text,
		N'برگشت از خرید' ReferenceDocTypeName,
		'ReturnFromBuy' RefDocName,
		cast(ReturnFromBuyItem.CreationTime as date) RequestDateTime, 
		afw.GregorianToPersian(ReturnFromBuyItem.CreationTime) RequestDateTime_Text
	from ps_ReturnFromBuyItems ReturnFromBuyItem
		left join ps_ReturnFromBuys ReturnFromBuy on ReturnFromBuy.ID = ReturnFromBuyItem.ReturnFromBuy
		left join cmn_Stuffs Stuff on Stuff.ID = ReturnFromBuyItem.Stuff
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = ReturnFromBuy.CreatorUser
		left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = ReturnFromBuy.OrganizationUnit	
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReturnFromBuy.FinancialDocType
	where not exists(select 1 from wm_GhabzOrHavaleha where RefDoc_ReturnFromBuy = ReturnFromBuy.ID)
		and ReturnFromBuyItem.Service is null
go

afw.BeforeAlterView 'wm_GhetehBardariAzKalaListView'
go
alter view wm_GhetehBardariAzKalaListView as
	select	GhetehBardariAzKala.ID,
		GhetehBardariAzKala.FinancialYear,
		GhetehBardariAzKala.MainStuff,
		GhetehBardariAzKala.OpNumber as OpNumber, 
		GhetehBardariAzKala.CreationTime,
		StuffDef.Name StuffDef_Text, 
		GhetehBardariAzKala.BatchNumber,
		GhetehBardariAzKala.StuffSerialNumbers, 
		GhetehBardariAzKala.SourceStuffLocation,
		SourceStuffLocation.Name SourceStuffLocation_Text,
		GhetehBardariAzKala.ComponentsDestinationStuffLocation,
		ComponentsDestinationStuffLocation.Name ComponentsDestinationStuffLocation_Text, 
		GhetehBardariAzKala.Description,
		GhetehBardariAzKala.StuffStatus,
		StuffStatus.Title StuffStatus_Tilte
	from wm_GhetehBardariAzKalaha GhetehBardariAzKala
		left join cmn_Stuffs Stuff on Stuff.ID = GhetehBardariAzKala.MainStuff
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
		left join cmn_StuffLocations ComponentsDestinationStuffLocation 
			on ComponentsDestinationStuffLocation.ID = GhetehBardariAzKala.ComponentsDestinationStuffLocation
		left join cmn_StuffLocations SourceStuffLocation on SourceStuffLocation.ID = GhetehBardariAzKala.SourceStuffLocation
		left join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhetehBardariAzKala.StuffStatus
go

afw.BeforeAlterView 'wm_StuffStatusChangeAndTransferListView'
go
alter view wm_StuffStatusChangeAndTransferListView as
	select StuffStatusChangeAndTransfer.ID, 
		StuffStatusChangeAndTransfer.FinancialYear,
		StuffStatusChangeAndTransfer.CreationTime,
		StuffStatusChangeAndTransfer.SourceStuffLocation,
		SourceStuffLocation.Name SourceStuffLocation_Text,
		StuffStatusChangeAndTransfer.DestinationStuffLocation,
		DestinationStuffLocation.Name DestinationStuffLocation_Text,
		StuffStatusChangeAndTransfer.PrimaryStatus,
		PrimaryStatus.Title PrimaryStatus_Text,
		StuffStatusChangeAndTransfer.SeconderyStatus,
		SeconderyStatus.Title SeconderyStatus_Text,
		StuffStatusChangeAndTransfer.Description,
		StuffStatusChangeAndTransferType.Title StuffStatusChangeAndTransferType_Title,
		StuffStatusChangeAndTransfer.OpNumber,
		afw.GregorianToPersian(StuffStatusChangeAndTransfer.IssueDate) IssueDate_PersionText
	from wm_StuffStatusChangeAndTransfers StuffStatusChangeAndTransfer
		left join cmn_StuffLocations SourceStuffLocation 
			on SourceStuffLocation.ID = StuffStatusChangeAndTransfer.SourceStuffLocation
		left join cmn_StuffLocations DestinationStuffLocation 
			on DestinationStuffLocation.ID = StuffStatusChangeAndTransfer.DestinationStuffLocation
		left join wm_StuffStatuss PrimaryStatus on PrimaryStatus.ID = StuffStatusChangeAndTransfer.PrimaryStatus
		left join wm_StuffStatuss SeconderyStatus on SeconderyStatus.ID = StuffStatusChangeAndTransfer.SeconderyStatus
		left join wm_StuffStatusChangeAndTransferTypes StuffStatusChangeAndTransferType
			on StuffStatusChangeAndTransferType.ID = StuffStatusChangeAndTransfer.StuffStatusChangeAndTransferType
go

afw.BeforeAlterView 'wm_MontageOrDemontagesView'
go
alter view wm_MontageOrDemontagesView as
	select MontageOrDemontage.ID,
		MontageOrDemontage.OpType,
		OpType.Name OpType_Name,
		OpType.Title OpType_Title,
		MontageOrDemontage.CreationTime,
		afw.GregorianToPersian(MontageOrDemontage.CreationTime) CreationTime_Persian,
		MontageOrDemontage.FinancialYear,
		FinancialDocType.Title FinancialDocType_Text,
		MontageOrDemontage.OrganizationUnit,
		OrganizationUnit.Name OrganizationUnit_Text,
		MontageOrDemontage.IssueDate,
		afw.GregorianToPersian(MontageOrDemontage.IssueDate) IssueDate_Persian,
		MontageOrDemontage.OpNumber as OpNumber, 
		MontageOrDemontage.MainStuff,
		MainStuff_StuffDef.Name MainStuff_Text, 
		MontageOrDemontage.MainStuffBatchNumber,
		MontageOrDemontage.MainStuffStatus,
		MainStuffStatus.Title MainStuffStatus_Text,
		MontageOrDemontage.StuffLocation,
		StuffLocation.Name StuffLocation_Text,
		MontageOrDemontage.Description,
		MontageOrDemontage.Quantity
	from wm_MontageOrDemontages MontageOrDemontage
		left join afw_OptionSetItems OpType on OpType.ID = MontageOrDemontage.OpType
		left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = MontageOrDemontage.OrganizationUnit
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = MontageOrDemontage.FinancialDocType
		left join cmn_Stuffs MainStuff on MainStuff.ID = MontageOrDemontage.MainStuff
		left join cmn_StuffDefs MainStuff_StuffDef on MainStuff_StuffDef.ID = MainStuff.StuffDef
		left join cmn_StuffLocations StuffLocation on StuffLocation.ID = MontageOrDemontage.StuffLocation
		left join wm_StuffStatuss MainStuffStatus on MainStuffStatus.ID = MontageOrDemontage.MainStuffStatus
go

afw.BeforeAlterView 'wm_MontageOrDemontageStuffComponentsView'
go
alter view wm_MontageOrDemontageStuffComponentsView as
	select StuffComponent.ID,
		StuffComponent.MontageOrDemontage,
		StuffComponent.RowNumber,
		StuffComponent.Stuff,
		StuffDef.Name Stuff_Text,
		StuffComponent.StuffStatus,
		StuffStatus.Title StuffStatus_Text,
		StuffComponent.BatchNumber,
		StuffComponent.QuantityInOneProduct,
		StuffComponent.TotalQuantity,
		StuffComponent.Demontage_ValuationPercent
	from wm_MontageOrDemontageStuffComponents StuffComponent
		left join cmn_Stuffs Stuff on Stuff.ID = StuffComponent.Stuff
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
		left join wm_StuffStatuss StuffStatus on StuffStatus.ID = StuffComponent.StuffStatus
go	

afw.BeforeAlterProc 'wm.StuffsCirculationReport'
go
alter procedure wm.StuffsCirculationReport
	@FilterExpression nvarchar(4000),
	@FromDate Date,
	@StartRecordNumber int,
	@MaxRecords int
as
begin 
	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000

	if (CHARINDEX('IssueDate>', REPLACE(@FilterExpression, ' ', '')) > 0
		or CHARINDEX('IssueDate=', REPLACE(@FilterExpression, ' ', '')) > 0)
		raiserror (N'FilterExpression of StuffsCirculationReport cannot contain IssueDate > and IssueDate =', 16, 1); 		

	set nocount on;

	create table #ResultTable1 (
		RowNumber int,
		StuffID uniqueidentifier,
		Name nvarchar(500),
		Code nvarchar(50),
		Custom_CodeAnbar nvarchar(50),
		StuffStatus uniqueidentifier,
		StuffStatus_Title nvarchar(100),
		BatchNumber nvarchar(20),
		StuffLocation uniqueidentifier,
		StuffLocation_Name nvarchar(50),
		GhabzOrHavaleNumber bigint,
		WarehouseDocType_Name varchar(10),
		GhabzOrHavaleType uniqueidentifier,
		GhabzOrHavaleType_Title nvarchar(100),
		IssueDate datetime,
		CreationTime datetime,
		Varedeh decimal(19, 3),
		Sadereh decimal(19, 3))
	
	declare @Query nvarchar(4000)

	set @Query = '
		insert into #ResultTable1
		select ROW_NUMBER() over (
			order by GhabzOrHavale.IssueDate, 
				case when WarehouseDocType.Name = ''Ghabz'' then 1 else 2 end,
				GhabzOrHavale.CreationTime) RowNumber,
			Stuff.ID StuffID, 
			StuffDef.Name, 
			StuffDef.Code, 
			StuffDef.Custom_CodeAnbar, 
			GhabzOrHavaleItem.StuffStatus, 
			StuffStatus.Title StuffStatus_Title,
			GhabzOrHavaleItem.BatchNumber, 
			GhabzOrHavale.StuffLocation, 
			StuffLocation.Name StuffLocation_Name, 
			GhabzOrHavale.GhabzOrHavaleNumber,
			WarehouseDocType.Name WarehouseDocType_Name,
			GhabzOrHavale.GhabzOrHavaleType, 
			GhabzOrHavaleType.Title GhabzOrHavaleType_Title,
			GhabzOrHavale.IssueDate,
			GhabzOrHavale.CreationTime,
			case when WarehouseDocType.Name = ''Ghabz'' then isnull(GhabzOrHavaleItem.Quantity, 0) end Varedeh,
			case when WarehouseDocType.Name = ''Havale'' then isnull(GhabzOrHavaleItem.Quantity, 0) end Sadereh
		from cmn_Stuffs Stuff
			left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
			inner join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.Stuff = Stuff.ID
			left join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
			left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
			left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
			left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
			left join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
		where ISNULL(GhabzOrHavaleItem.Quantity, 0) <> 0
			and ' + @FilterExpression
	
	exec sp_executesql @Query

	create table #ResultTable2 (
		RowNumber int,
		RowNumberInResultTable1 int,
		StuffID uniqueidentifier,
		Name nvarchar(500),
		Code nvarchar(50),
		Custom_CodeAnbar nvarchar(50),
		StuffStatus uniqueidentifier,
		StuffStatus_Title nvarchar(100),
		BatchNumber nvarchar(20),
		StuffLocation uniqueidentifier,
		StuffLocation_Name nvarchar(50),
		GhabzOrHavaleNumber bigint,
		WarehouseDocType_Name varchar(10),
		GhabzOrHavaleType uniqueidentifier,
		GhabzOrHavaleType_Title nvarchar(100),
		IssueDate datetime,
		CreationTime datetime,
		Varedeh decimal(19, 3),
		Sadereh decimal(19, 3))

	--جدول 1 برای محاسبه مانده ها و جدول 2 برای فیلتر کردن نتیجه خروجی است
	--بدلیل اینکه فیلتر تاریخ شروع نباید روی محاسبه مانده ها تاثیر بگذارد جدا شده و در اینجا اعمال می شود
	insert into #ResultTable2
	select ROW_NUMBER() over (
		order by IssueDate, 
			case when WarehouseDocType_Name = 'Ghabz' then 1 else 2 end) RowNumber,
		*
	from #ResultTable1
	where @FromDate is null 
		or IssueDate >= @FromDate

	declare @PagingSqlQuery nvarchar(4000)

	set @PagingSqlQuery = '
		select top ' + cast(@MaxRecords as nvarchar) + ' *,
			afw.GregorianToPersian(ResultItem.IssueDate) ZamaneVorodYaKhoroj,
			(
				select isnull(sum(Varedeh), 0) - isnull(sum(Sadereh), 0) 
				from #ResultTable1
				where StuffID = ResultItem.StuffID
					and isnull(StuffStatus_Title, '''') = isnull(ResultItem.StuffStatus_Title, '''')
					and isnull(BatchNumber, '''') = isnull(ResultItem.BatchNumber, '''')
					and StuffLocation = ResultItem.StuffLocation			
					and RowNumber < ResultItem.RowNumberInResultTable1
			) + isnull(ResultItem.Varedeh, 0) - isnull(ResultItem.Sadereh, 0) Mandeh,
			(select count(1) from #ResultTable2) TotalRecordsCount
		from #ResultTable2 ResultItem
		where RowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
		'order by RowNumber '

	exec(@PagingSqlQuery)
end
go

afw.BeforeAlterProc 'wm.StuffsStockReport'
go
alter procedure wm.StuffsStockReport
	@SeparateByBatchNumbers bit,
	@DisplayZeroStocks bit,
	@FilterExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@StartRecordNumber int,
	@MaxRecords int
as
begin 
	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @SortExpression is null set @SortExpression = N'Code'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000

	create table #TempTable
	(
		StuffID uniqueidentifier, 
		StuffDefID uniqueidentifier, 
		DisplayName nvarchar(500), 
		Code nvarchar(50), 
		BarCode nvarchar(50), 
		Name nvarchar(500), 
		TechnicalName nvarchar(100),
		MainCategory uniqueidentifier,
		MainCategory_Text nvarchar(100), 
		SubCategory uniqueidentifier,
		SubCategory_Text nvarchar(100), 
		MainMeasurementUnit_Text nvarchar(100), 
		Brand nvarchar(50), 
		Model nvarchar(50), 
		Custom_Battery nvarchar(50), 
		Custom_Esteghrar nvarchar(50), 
		Custom_CodeAnbar nvarchar(50), 
		Custom_CodeHesabdari nvarchar(50), 
		Custom_TavanKva nvarchar(50), 
		Custom_Phase nvarchar(50), 
		Custom_TedadeMaheGaranti nvarchar(50), 
		StuffLocation uniqueidentifier,
		StuffLocation_Name nvarchar(100),
		StuffStatus uniqueidentifier,
		StuffStatus_Title nvarchar(50),
		BatchNumber nvarchar(50),
		Quantity int,
		TotalRecordsCount int
	)

	declare @Query nvarchar(4000)
	set @Query = '
		insert into #TempTable(StuffID, StuffDefID, DisplayName, Code, BarCode, Name, TechnicalName, MainCategory, MainCategory_Text, 
			SubCategory, SubCategory_Text, MainMeasurementUnit_Text, Brand, Model, Custom_Battery, Custom_Esteghrar, Custom_CodeAnbar, Custom_CodeHesabdari,
			Custom_TavanKva, Custom_Phase, Custom_TedadeMaheGaranti, StuffLocation, StuffLocation_Name, StuffStatus, StuffStatus_Title, BatchNumber, Quantity)
		select GhabzOrHavaleItem.Stuff,
			StuffDef.ID, 
			isnull(StuffDef.Code, '''') + '' - '' + isnull(StuffDef.Name, '''') DisplayName, 
			StuffDef.Code,
			StuffDef.BarCode,
			StuffDef.Name,
			StuffDef.TechnicalName,
			SubCategory.MainCategory,
			MainCategory.Title MainCategory_Text,
			StuffDef.SubCategory,
			SubCategory.Title SubCategory_Text,
			MainMeasurementUnit.Title MainMeasurementUnit_Text, 
			StuffDef.Brand,
			StuffDef.Model,
			StuffDef.Custom_Battery,
			StuffDef.Custom_Esteghrar,
			StuffDef.Custom_CodeAnbar,
			StuffDef.Custom_CodeHesabdari,
			StuffDef.Custom_TavanKva,
			StuffDef.Custom_Phase,
			StuffDef.Custom_TedadeMaheGaranti,
			GhabzOrHavale.StuffLocation,
			GhabzOrHavale.StuffLocation_Name,
			GhabzOrHavaleItem.StuffStatus, 
			GhabzOrHavaleItem.StuffStatus_Title,
			[BatchNumberInSelect] BatchNumber,
			sum(case when WarehouseDocType.Name = ''Ghabz'' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end) RealStock
		from cmn_StuffDefs StuffDef 
			left join cmn_StuffSubCategories SubCategory on SubCategory.ID = StuffDef.SubCategory 
			left join cmn_StuffMainCategories MainCategory on MainCategory.ID = SubCategory.MainCategory 
			left join cmn_MeasurementUnits MainMeasurementUnit on MainMeasurementUnit.ID = StuffDef.MainMeasurementUnit
			inner join wm_GhabzOrHavaleItemsView as GhabzOrHavaleItem on GhabzOrHavaleItem.StuffDef = StuffDef.ID
			left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
			left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
			left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
		where ' + @FilterExpression + '
		group by GhabzOrHavaleItem.Stuff, StuffDef.ID, isnull(StuffDef.Code, '''') + '' - '' + isnull(StuffDef.Name, ''''), 
			StuffDef.Code,  BarCode, StuffDef.Name, TechnicalName, MainCategory, MainCategory.Title, SubCategory,
			SubCategory.Title, MainMeasurementUnit.Title, Brand, Model, Custom_Battery, Custom_Esteghrar, Custom_CodeAnbar, Custom_CodeHesabdari,
			Custom_TavanKva, Custom_Phase, Custom_TedadeMaheGaranti, StuffLocation, StuffLocation_Name, StuffStatus,
			[BatchNumberInGroupBy] 
			StuffStatus_Title'

	if (@SeparateByBatchNumbers = 0)
	begin
		set @Query = replace(@Query, '[BatchNumberInSelect]', N'N''همه''')
		set @Query = replace(@Query, '[BatchNumberInGroupBy]', N'')
	end
	else
	begin
		set @Query = replace(@Query, '[BatchNumberInSelect]', N'GhabzOrHavaleItem.BatchNumber')
		set @Query = replace(@Query, '[BatchNumberInGroupBy]', N'GhabzOrHavaleItem.BatchNumber, ')
	end

	--if (@DisplayZeroStocks = 0)
	--	set @Query = @Query + N' having sum(case when WarehouseDocType.Name = ''Ghabz'' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end) <> 0'

	--print @Query

	exec(@Query)	

	if (@DisplayZeroStocks = 0)
		delete #TempTable where Quantity = 0

	update #TempTable
	set TotalRecordsCount = (select count(1) from #TempTable)

	declare @PagingSqlQuery nvarchar(4000)
	set @PagingSqlQuery = '
		select top ' + cast(@MaxRecords as nvarchar) + ' *
		from (
			select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
			from (
				select * 
				from #TempTable) NotPagedQuery 
		) NotPagedQuery2
		where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
		'order by NotPagedQuery2._PagingRowNumber '

	exec (@PagingSqlQuery)
end
go

afw.BeforeAlterProc 'wm.KarteksTedadiRialiKala'
go
alter procedure wm.KarteksTedadiRialiKala
	@FromDate date, @ToDate date, @Stuff uniqueidentifier, @Person uniqueidentifier,
	@StuffLocation uniqueidentifier , @OrganizationUnit uniqueidentifier , @FinancialDocType uniqueidentifier 
	as
set fmtonly off
begin
	
	create Table #TempTable(
		RowNumber int,
		StuffName nvarchar(100), 
		StuffDef uniqueidentifier,
		GhabzID uniqueidentifier,
		HavaleID uniqueidentifier,
		WarehouseRialiRef uniqueidentifier,
		HavaleUnitPrice bigint,
		GhabzUnitPrice bigint,
		HavaleTotalPrice bigint,
		GhabzTotalPrice bigint,
		GhabzStuff uniqueidentifier,
		HavaleStuff uniqueidentifier,
		HavaleNumber nvarchar(50),
		GhabzNumber nvarchar(50),
		GhabzOrHavaleTypeTitle nvarchar(50),
		IssueDate varchar(10),
		CustomerName nvarchar(50),
		SellerName nvarchar(50),		
		Enter bigint,
		Export bigint,
		Remaining bigint,
		RialiUnitPrice bigint,
		RialiTotalPrice bigint,)	
	
	declare @FinancialYearStartDate date;
	
	select @FinancialYearStartDate = StartDate
	from cmn_FinancialYears
	where YearNo = substring(afw.GregorianToPersian(@FromDate) , 1 , 4)
	
	--print @FinancialYearStartDate
	--print afw.GregorianToPersian(@FromDate) 
	
	--منقول از ابتدا سال مالی انتخاب شده
	if(@FinancialYearStartDate < @FromDate)
	begin
		insert into #TempTable( StuffName,
			StuffDef,
			IssueDate,
			GhabzOrHavaleTypeTitle,
			HavaleUnitPrice,
			GhabzUnitPrice,
			HavaleTotalPrice,
			GhabzTotalPrice,
			Export,
			Enter)	
		select StuffName,
			StuffDef,
			afw.GregorianToPersian(@FinancialYearStartDate),
			N'منقول از تاریخ ' + cast (afw.GregorianToPersian(@FinancialYearStartDate) as nvarchar(10))+ 
			N' تا ' + cast(afw.GregorianToPersian(@FromDate) as nvarchar(10)) note , 
			isnull(avg(SubQuery.HavaleUnitPrice), 0) HavaleUnitPrice,
			isnull(avg(SubQuery.GhabzUnitPrice), 0) GhabzUnitPrice,
			isnull(sum(HavaleTotalPrice), 0) HavaleTotalPrice,
			isnull(sum(GhabzTotalPrice), 0) GhabzTotalPrice,		
			isnull(sum(HavaleQuantity), 0) Export,
			isnull(sum(GhabzQuantity), 0) Enter
		from (  
		select StuffDefs.Name StuffName,
			Stuffs.StuffDef,
			null HavaleUnitPrice,
			case 
				when Ghabz.RefDoc_BuyInvoice is not null then(
					select top 1 UnitPrice from ps_BuyInvoiceItems
					where BuyInvoice = Ghabz.RefDoc_BuyInvoice and 
						Stuff = GhabzItem.Stuff)
				when Ghabz.RefDoc_ReturnFromSale is not null then(
					select top 1 UnitPrice from ps_ReturnFromSaleItems 
					where ReturnFromSale = Ghabz.RefDoc_ReturnFromSale and 
						Stuff = GhabzItem.Stuff)
				else GhabzItem.RialiAmount / GhabzItem.Quantity 
			end GhabzUnitPrice,
			null HavaleTotalPrice,
			case 
				when Ghabz.RefDoc_BuyInvoice is not null then(
					select top 1 TotalPrice from ps_BuyInvoiceItems
					where BuyInvoice = Ghabz.RefDoc_BuyInvoice and 
						Stuff = GhabzItem.Stuff)
				when Ghabz.RefDoc_ReturnFromSale is not null then(
					select top 1 TotalPrice from ps_ReturnFromSaleItems 
					where ReturnFromSale = Ghabz.RefDoc_ReturnFromSale and 
						Stuff = GhabzItem.Stuff)
				else GhabzItem.RialiAmount 
			end GhabzTotalPrice,		
			null HavaleQuantity,
			GhabzItem.Quantity GhabzQuantity
		from cmn_Stuffs Stuffs
			inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
			inner join wm_GhabzOrHavaleItems GhabzItem on Stuffs.ID = GhabzItem.Stuff
			inner join wm_GhabzOrHavalehaView Ghabz on Ghabz.ID = GhabzItem.GhabzOrHavale
			inner join cmn_Persons Customer on Customer.ID = Ghabz.TarafHesab_Person
		where StuffDefs.ID = @Stuff 
			and Ghabz.WarehouseDocType_Name = 'Ghabz'
			and (cast(Ghabz.IssueDate as date) >= @FinancialYearStartDate and cast(Ghabz.IssueDate as date) < @FromDate)
			and (@Person is null or Customer.ID = @Person)
			and (@StuffLocation is null or Ghabz.StuffLocation = @StuffLocation)
			and (@OrganizationUnit is null or Ghabz.OrganizationUnit = @OrganizationUnit)
			and (@FinancialDocType is null or Ghabz.FinancialDocType = @FinancialDocType)	
		union all
		select StuffDefs.Name StuffName,
			Stuffs.StuffDef,
			case 
				when Havale.RefDoc_SalesInvoice is not null then(
					select top 1 UnitPrice from ps_SalesInvoiceItems
					where SalesInvoice = Havale.RefDoc_SalesInvoice and 
						Stuff = HavaleItem.Stuff)
				when Havale.RefDoc_ReturnFromBuy is not null then(
					select top 1 UnitPrice from ps_ReturnFromBuyItems 
					where ReturnFromBuy = Havale.RefDoc_ReturnFromBuy and 
						Stuff = HavaleItem.Stuff)
				else HavaleItem.RialiAmount / HavaleItem.Quantity 
			end HavaleUnitPrice,
			null GhabzUnitPrice,
			case 
				when Havale.RefDoc_SalesInvoice is not null then(
					select top 1 TotalPrice from ps_SalesInvoiceItems
					where SalesInvoice = Havale.RefDoc_SalesInvoice and 
						Stuff = HavaleItem.Stuff)
				when Havale.RefDoc_ReturnFromBuy is not null then(
					select top 1 TotalPrice from ps_ReturnFromBuyItems 
					where ReturnFromBuy = Havale.RefDoc_ReturnFromBuy and 
						Stuff = HavaleItem.Stuff)
				else HavaleItem.RialiAmount
			end HavaleTotalPrice,
			null GhabzTotalPrice,				
			HavaleItem.Quantity HavaleQuantity,
			null GhabzQuantity
		from cmn_Stuffs Stuffs
			inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
			inner join wm_GhabzOrHavaleItems HavaleItem on Stuffs.ID = HavaleItem.Stuff
			inner join wm_GhabzOrHavalehaView Havale on Havale.ID = HavaleItem.GhabzOrHavale
			inner join cmn_Persons Seller on Seller.ID = Havale.TarafHesab_Person
		where StuffDefs.ID = @Stuff 
			and Havale.WarehouseDocType_Name = 'Havale'
			and (cast(Havale.IssueDate as date) >= @FinancialYearStartDate and cast(Havale.IssueDate as date) < @FromDate)
			and (@Person is null or seller.ID = @Person)
			and (@StuffLocation is null or havale.StuffLocation = @StuffLocation)
			and (@OrganizationUnit is null or havale.OrganizationUnit = @OrganizationUnit)
			and (@FinancialDocType is null or havale.FinancialDocType = @FinancialDocType)			
		) SubQuery
		group by StuffName,
			StuffDef
	end
	
	insert into #TempTable(StuffName,
		StuffDef,
		GhabzID,
		HavaleID,
		WarehouseRialiRef,
		GhabzOrHavaleTypeTitle,
		HavaleUnitPrice,
		GhabzUnitPrice,
		HavaleTotalPrice,
		GhabzTotalPrice,
		HavaleStuff,
		GhabzStuff,
		HavaleNumber,
		GhabzNumber,
		IssueDate,
		CustomerName,
		SellerName,
		Export,
		Enter)  
		  
	select StuffDefs.Name StuffName,
		Stuffs.StuffDef,
		GhabzItem.GhabzOrHavale GhabzID,
		null HavaleID,
		Ghabz.WareHouseDocRialiReference,
		Ghabz.GhabzOrHavaleType_Title,
		null HavaleUnitPrice,
		case 
			when Ghabz.RefDoc_BuyInvoice is not null then(
				select top 1 UnitPrice from ps_BuyInvoiceItems
				where BuyInvoice = Ghabz.RefDoc_BuyInvoice and 
					Stuff = GhabzItem.Stuff)
			when Ghabz.RefDoc_ReturnFromSale is not null then(
				select top 1 UnitPrice from ps_ReturnFromSaleItems 
				where ReturnFromSale = Ghabz.RefDoc_ReturnFromSale and 
					Stuff = GhabzItem.Stuff)
			else GhabzItem.RialiAmount / GhabzItem.Quantity 
		end GhabzUnitPrice,
		null HavaleTotalPrice,
		case 
			when Ghabz.RefDoc_BuyInvoice is not null then(
				select top 1 TotalPrice from ps_BuyInvoiceItems
				where BuyInvoice = Ghabz.RefDoc_BuyInvoice and 
					Stuff = GhabzItem.Stuff)
			when Ghabz.RefDoc_ReturnFromSale is not null then(
				select top 1 TotalPrice from ps_ReturnFromSaleItems 
				where ReturnFromSale = Ghabz.RefDoc_ReturnFromSale and 
					Stuff = GhabzItem.Stuff)
			else GhabzItem.RialiAmount 
		end GhabzTotalPrice,
		null HavaleStuff,
		GhabzItem.Stuff GhabzStuff,
		null HavaleNumber,
		Ghabz.GhabzOrHavaleNumber GhabzNumber,
		substring (cast(afw.GregorianToPersian(Ghabz.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(Ghabz.IssueDate)) + 2) IssueDate,
		Customer.Name CustomerName,
		null SellerName,
		null HavaleQuantity,
		GhabzItem.Quantity GhabzQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join wm_GhabzOrHavaleItems GhabzItem on Stuffs.ID = GhabzItem.Stuff
		inner join wm_GhabzOrHavalehaView Ghabz on Ghabz.ID = GhabzItem.GhabzOrHavale
		inner join cmn_Persons Customer on Customer.ID = Ghabz.TarafHesab_Person
	where StuffDefs.ID = @Stuff 
		and Ghabz.WarehouseDocType_Name = 'Ghabz'
		and (cast(Ghabz.IssueDate as date) >= @FromDate and cast(Ghabz.IssueDate as date) <= @ToDate)
		and (@Person is null or Customer.ID = @Person)
		and (@StuffLocation is null or Ghabz.StuffLocation = @StuffLocation)
		and (@OrganizationUnit is null or Ghabz.OrganizationUnit = @OrganizationUnit)
		and (@FinancialDocType is null or Ghabz.FinancialDocType = @FinancialDocType)
	union all
	select StuffDefs.Name StuffName,
		Stuffs.StuffDef,
		null GhabzID,
		HavaleItem.GhabzOrHavale HavaleID,
		Havale.WareHouseDocRialiReference,
		Havale.GhabzOrHavaleType_Title,
		case 
			when Havale.RefDoc_SalesInvoice is not null then(
				select top 1 UnitPrice from ps_SalesInvoiceItems
				where SalesInvoice = Havale.RefDoc_SalesInvoice and 
					Stuff = HavaleItem.Stuff)
			when Havale.RefDoc_ReturnFromBuy is not null then(
				select top 1 UnitPrice from ps_ReturnFromBuyItems 
				where ReturnFromBuy = Havale.RefDoc_ReturnFromBuy and 
					Stuff = HavaleItem.Stuff)
			else HavaleItem.RialiAmount / HavaleItem.Quantity 
		end HavaleUnitPrice,
		null GhabzUnitPrice,
		case 
			when Havale.RefDoc_SalesInvoice is not null then(
				select top 1 TotalPrice from ps_SalesInvoiceItems
				where SalesInvoice = Havale.RefDoc_SalesInvoice and 
					Stuff = HavaleItem.Stuff)
			when Havale.RefDoc_ReturnFromBuy is not null then(
				select top 1 TotalPrice from ps_ReturnFromBuyItems 
				where ReturnFromBuy = Havale.RefDoc_ReturnFromBuy and 
					Stuff = HavaleItem.Stuff)
			else HavaleItem.RialiAmount
		end HavaleTotalPrice,
		null GhabzTotalPrice,
		HavaleItem.Stuff HavaleStuff,
		null GhabzStuff,
		Havale.GhabzOrHavaleNumber HavaleNumber,
		null GhabzNumber,
		substring (cast(afw.GregorianToPersian(Havale.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(Havale.IssueDate)) + 2) IssueDate,
		null CustomerName,
		Seller.Name SellerName,
		HavaleItem.Quantity HavaleQuantity,
		null GhabzQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join wm_GhabzOrHavaleItems HavaleItem on Stuffs.ID = HavaleItem.Stuff
		inner join wm_GhabzOrHavalehaView Havale on Havale.ID = HavaleItem.GhabzOrHavale
		inner join cmn_Persons Seller on Seller.ID = Havale.TarafHesab_Person
	where StuffDefs.ID = @Stuff 
		and Havale.WarehouseDocType_Name = 'Havale'
		and (cast(Havale.IssueDate as date) >= @FromDate and cast(Havale.IssueDate as date) <= @ToDate)
		and (@Person is null or Seller.ID = @Person)
		and (@StuffLocation is null or Havale.StuffLocation = @StuffLocation)
		and (@OrganizationUnit is null or Havale.OrganizationUnit = @OrganizationUnit)
		and (@FinancialDocType is null or Havale.FinancialDocType = @FinancialDocType)
	order by IssueDate
	
	----Set row number
	
	update TempTable
	set RowNumber = TempTable.CalculatedRowNumber
	from (
		select *, 
			row_number() over (order by IssueDate,
				case when WarehouseRialiRef is null then 0 else 1 end
			) CalculatedRowNumber		
		from #TempTable
		) TempTable
			
	declare @Havale uniqueidentifier;
	declare @Ghabz uniqueidentifier;
	declare @RowsCount int;
	declare @I int;
	declare @GhabzhaTotalPrice bigint;
	declare @RialiUnitPrice bigint;
	declare @Enter bigint;
	declare @Export bigint; 
	declare @Remaining bigint;
		
	create table #TempTable1(
		RowNumber int,
		GhabzOrHavale uniqueidentifier,
		Kind nvarchar(50),
		WarehouseDocType nvarchar(10),
		GhabzUnitPrice bigint,
		HavaleUnitPrice bigint,
		GhabzTotalPrice bigint,
		HavaleTotalPrice bigint,
		StuffName nvarchar(50), 
		GhabzOrHavaleNumber nvarchar(50), 
		GhabzOrHavaleDate varchar(10), 
		Customer nvarchar(50), 
		Enter bigint, 
		Export bigint, 
		Remaining bigint,
		RialiUnitPrice bigint,
		RialiTotalPrice bigint)			
	
	select @RowsCount = count(RowNumber) from #TempTable;

	select @I = 1 , @GhabzhaTotalPrice = 0, @RialiUnitPrice = 0,
		@Remaining = 0,@Enter = 0, @Export = 0

	while @I <= @RowsCount
	begin
		declare @RowNumber int;
		declare @GhabzOrHavale uniqueidentifier;
		declare @Kind nvarchar(50);
		declare @GhabzUnitPrice bigint;
	    declare @HavaleUnitPrice bigint;
		declare @GhabzTotalPrice bigint;
		declare @HavaleTotalPrice bigint;
		declare @StuffName nvarchar(50);
		declare @GhabzOrHavaleNumber nvarchar(50);
		declare @GhabzOrHavaleDate varchar(10);
		declare @Customer nvarchar(50);
		declare @WarehouseDocType nvarchar(10);
		
		select @Havale = HavaleID From #TempTable where RowNumber = @I
		select @Ghabz = GhabzID from #TempTable where RowNumber = @I
		select @RialiUnitPrice = case when @Remaining < 1 then 0 
			else  @GhabzhaTotalPrice / @Remaining end
			
		if @Havale is not null 
		begin 
			select	@GhabzOrHavale = @Havale ,
				@Kind = GhabzOrHavaleTypeTitle,
				@GhabzUnitPrice = 0,
				@HavaleUnitPrice = HavaleUnitPrice,
				@GhabzTotalPrice = 0,
				@HavaleTotalPrice = HavaleTotalPrice,
				@StuffName =StuffName,
				@Enter = 0, 
				@GhabzOrHavaleNumber = HavaleNumber, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = CustomerName,
				@WarehouseDocType = 'Havale',
				@Export = Export,
				@GhabzhaTotalPrice = @GhabzhaTotalPrice - ( Export * @RialiUnitPrice)
			from #TempTable 
			where RowNumber = @I			
		end
		else if @Ghabz is not null 
		begin 
			select	@GhabzOrHavale = @Ghabz ,
				@Kind = GhabzOrHavaleTypeTitle,
				@GhabzUnitPrice = GhabzUnitPrice,
				@HavaleUnitPrice = 0,
				@GhabzTotalPrice = GhabzTotalPrice,
				@HavaleTotalPrice = 0,
				@StuffName =StuffName,
				@Export = 0, 
				@GhabzOrHavaleNumber = GhabzNumber, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = SellerName,
				@Enter = Enter,
				@WarehouseDocType = 'Ghabz',
				@GhabzhaTotalPrice = @GhabzhaTotalPrice + GhabzTotalPrice
			from #TempTable 
			where RowNumber = @I							
		end
		else
		begin
			select	@GhabzOrHavale = '00000000-0000-0000-0000-000000000000' ,
				@Kind = GhabzOrHavaleTypeTitle,
				@GhabzUnitPrice = GhabzUnitPrice,
				@HavaleUnitPrice = HavaleUnitPrice,
				@GhabzTotalPrice = GhabzTotalPrice,
				@HavaleTotalPrice = HavaleTotalPrice,
				@StuffName =StuffName,
				@Export = Export, 
				@GhabzOrHavaleNumber = null, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = '-',
				@Enter = Enter,
				@WarehouseDocType = null
			from #TempTable 
			where RowNumber = @I
		end
		
		insert into #TempTable1(
			RowNumber,
			GhabzOrHavale,
			Kind ,		
			WarehouseDocType,	
			GhabzUnitPrice,
			HavaleUnitPrice,
			GhabzTotalPrice,
			HavaleTotalPrice,
			StuffName, 
			GhabzOrHavaleNumber, 
			GhabzOrHavaleDate, 
			Customer, 
			Enter, 
			Export, 
			Remaining ,
			RialiUnitPrice ,
			RialiTotalPrice)
		values(@I,
			@GhabzOrHavale,
			@Kind,
			@WarehouseDocType,
			@GhabzUnitPrice,
			@HavaleUnitPrice,
			@GhabzTotalPrice,
			@HavaleTotalPrice,
			@StuffName,
			@GhabzOrHavaleNumber, 
			@GhabzOrHavaleDate,
			@Customer,
			@Enter,
			@Export,
			0, 0, 0 )
		
		select @Enter = Enter, @Export = Export from #TempTable1 where RowNumber = @I
		select @Remaining =  (@Enter + @Remaining)  - @Export
		update #TempTable1 
		set Remaining = @Remaining , 
			RialiUnitPrice = 
				case when @Remaining< 1 then 0
					else @GhabzhaTotalPrice / @Remaining 
				end			
		where RowNumber = @I 
		
		
		update #TempTable1 
		set RialiTotalPrice = Remaining * RialiUnitPrice		
		where RowNumber = @I 		
		
		select @I = @I + 1
	end

	select * from #TempTable1
	order by GhabzOrHavaleDate
	
end
go

--exec wm.KarteksTedadiRialiKala '2017-3-21', '2018-3-20', '38337b64-309e-47ba-af19-6325e3029746', '00000000-0000-0000-0000-000000000000'


afw.BeforeAlterProc 'wm.KarteksTedadiKala'
go
alter procedure wm.KarteksTedadiKala
	@FromDate date, @ToDate date, @Stuff uniqueidentifier, @Person uniqueidentifier,
	@StuffLocation uniqueidentifier , @OrganizationUnit uniqueidentifier , @FinancialDocType uniqueidentifier 
as
set fmtonly off
begin
	
	create Table #TempTable(
		RowNumber int,
		StuffName nvarchar(100), 
		StuffDef uniqueidentifier,
		GhabzID uniqueidentifier,
		HavaleID uniqueidentifier,
		WarehouseRialiRef uniqueidentifier,
		GhabzStuff uniqueidentifier,
		HavaleStuff uniqueidentifier,
		HavaleNumber nvarchar(50),
		GhabzNumber nvarchar(50),
		GhabzOrHavaleTypeTitle nvarchar(50),
		IssueDate varchar(10),
		CustomerName nvarchar(50),
		SellerName nvarchar(50),		
		Enter bigint,
		Export bigint,
		Remaining bigint)	
	
	declare @FinancialYearStartDate date;
	
	select @FinancialYearStartDate = StartDate
	from cmn_FinancialYears
	where YearNo = substring(afw.GregorianToPersian(@FromDate) , 1 , 4)
	
	--print @FinancialYearStartDate
	--print afw.GregorianToPersian(@FromDate) 
	
	--منقول از ابتدا سال مالی انتخاب شده
	if(@FinancialYearStartDate < @FromDate)
	begin
		insert into #TempTable( StuffName,
			StuffDef,
			IssueDate,
			GhabzOrHavaleTypeTitle,
			Export,
			Enter)	
		select StuffName,
			StuffDef,
			afw.GregorianToPersian(@FinancialYearStartDate),
			N'منقول از تاریخ ' + cast (afw.GregorianToPersian(@FinancialYearStartDate) as nvarchar(10))+ 
			N' تا ' + cast(afw.GregorianToPersian(@FromDate) as nvarchar(10)) note , 					
			isnull(sum(HavaleQuantity), 0) Export,
			isnull(sum(GhabzQuantity), 0) Enter
		from (  
		select StuffDefs.Name StuffName,
			Stuffs.StuffDef,
			null HavaleQuantity,
			GhabzItem.Quantity GhabzQuantity
		from cmn_Stuffs Stuffs
			inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
			inner join wm_GhabzOrHavaleItems GhabzItem on Stuffs.ID = GhabzItem.Stuff
			inner join wm_GhabzOrHavalehaView Ghabz on Ghabz.ID = GhabzItem.GhabzOrHavale
			inner join cmn_Persons Customer on Customer.ID = Ghabz.TarafHesab_Person
		where StuffDefs.ID = @Stuff 
			and Ghabz.WarehouseDocType_Name = 'Ghabz'
			and (cast(Ghabz.IssueDate as date) >= @FinancialYearStartDate and cast(Ghabz.IssueDate as date) < @FromDate)
			and (@Person is null or Customer.ID = @Person)
			and (@StuffLocation is null or Ghabz.StuffLocation = @StuffLocation)
			and (@OrganizationUnit is null or Ghabz.OrganizationUnit = @OrganizationUnit)
			and (@FinancialDocType is null or Ghabz.FinancialDocType = @FinancialDocType)	
		union all
		select StuffDefs.Name StuffName,
			Stuffs.StuffDef,			
			HavaleItem.Quantity HavaleQuantity,
			null GhabzQuantity
		from cmn_Stuffs Stuffs
			inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
			inner join wm_GhabzOrHavaleItems HavaleItem on Stuffs.ID = HavaleItem.Stuff
			inner join wm_GhabzOrHavalehaView Havale on Havale.ID = HavaleItem.GhabzOrHavale
			inner join cmn_Persons Seller on Seller.ID = Havale.TarafHesab_Person
		where StuffDefs.ID = @Stuff 
			and Havale.WarehouseDocType_Name = 'Havale'
			and (cast(Havale.IssueDate as date) >= @FinancialYearStartDate and cast(Havale.IssueDate as date) < @FromDate)
			and (@Person is null or seller.ID = @Person)
			and (@StuffLocation is null or havale.StuffLocation = @StuffLocation)
			and (@OrganizationUnit is null or havale.OrganizationUnit = @OrganizationUnit)
			and (@FinancialDocType is null or havale.FinancialDocType = @FinancialDocType)			
		) SubQuery
		group by StuffName,
			StuffDef
	end
	
	insert into #TempTable(StuffName,
		StuffDef,
		GhabzID,
		HavaleID,
		WarehouseRialiRef,
		GhabzOrHavaleTypeTitle,
		HavaleStuff,
		GhabzStuff,
		HavaleNumber,
		GhabzNumber,
		IssueDate,
		CustomerName,
		SellerName,
		Export,
		Enter)  
		  
	select StuffDefs.Name StuffName,
		Stuffs.StuffDef,
		GhabzItem.GhabzOrHavale GhabzID,
		null HavaleID,
		Ghabz.WareHouseDocRialiReference,
		Ghabz.GhabzOrHavaleType_Title,
		null HavaleStuff,
		GhabzItem.Stuff GhabzStuff,
		null HavaleNumber,
		Ghabz.GhabzOrHavaleNumber GhabzNumber,
		substring (cast(afw.GregorianToPersian(Ghabz.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(Ghabz.IssueDate)) + 2) IssueDate,
		Customer.Name CustomerName,
		null SellerName,
		null HavaleQuantity,
		GhabzItem.Quantity GhabzQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join wm_GhabzOrHavaleItems GhabzItem on Stuffs.ID = GhabzItem.Stuff
		inner join wm_GhabzOrHavalehaView Ghabz on Ghabz.ID = GhabzItem.GhabzOrHavale
		inner join cmn_Persons Customer on Customer.ID = Ghabz.TarafHesab_Person
	where StuffDefs.ID = @Stuff 
		and Ghabz.WarehouseDocType_Name = 'Ghabz'
		and (cast(Ghabz.IssueDate as date) >= @FromDate and cast(Ghabz.IssueDate as date) <= @ToDate)
		and (@Person is null or Customer.ID = @Person)
		and (@StuffLocation is null or Ghabz.StuffLocation = @StuffLocation)
		and (@OrganizationUnit is null or Ghabz.OrganizationUnit = @OrganizationUnit)
		and (@FinancialDocType is null or Ghabz.FinancialDocType = @FinancialDocType)
	union all
	select StuffDefs.Name StuffName,
		Stuffs.StuffDef,
		null GhabzID,
		HavaleItem.GhabzOrHavale HavaleID,
		Havale.WareHouseDocRialiReference,
		Havale.GhabzOrHavaleType_Title,		
		HavaleItem.Stuff HavaleStuff,
		null GhabzStuff,
		Havale.GhabzOrHavaleNumber HavaleNumber,
		null GhabzNumber,
		substring (cast(afw.GregorianToPersian(Havale.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(Havale.IssueDate)) + 2) IssueDate,
		null CustomerName,
		Seller.Name SellerName,
		HavaleItem.Quantity HavaleQuantity,
		null GhabzQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join wm_GhabzOrHavaleItems HavaleItem on Stuffs.ID = HavaleItem.Stuff
		inner join wm_GhabzOrHavalehaView Havale on Havale.ID = HavaleItem.GhabzOrHavale
		inner join cmn_Persons Seller on Seller.ID = Havale.TarafHesab_Person
	where StuffDefs.ID = @Stuff 
		and Havale.WarehouseDocType_Name = 'Havale'
		and (cast(Havale.IssueDate as date) >= @FromDate and cast(Havale.IssueDate as date) <= @ToDate)
		and (@Person is null or Seller.ID = @Person)
		and (@StuffLocation is null or Havale.StuffLocation = @StuffLocation)
		and (@OrganizationUnit is null or Havale.OrganizationUnit = @OrganizationUnit)
		and (@FinancialDocType is null or Havale.FinancialDocType = @FinancialDocType)
	order by IssueDate
	
	----Set row number
	
	update TempTable
	set RowNumber = TempTable.CalculatedRowNumber
	from (
		select *, 
			row_number() over (order by IssueDate,
				case when WarehouseRialiRef is null then 0 else 1 end
			) CalculatedRowNumber		
		from #TempTable
		) TempTable
			
	declare @Havale uniqueidentifier;
	declare @Ghabz uniqueidentifier;
	declare @RowsCount int;
	declare @I int;
	declare @GhabzhaTotalPrice bigint;
	declare @RialiUnitPrice bigint;
	declare @Enter bigint;
	declare @Export bigint; 
	declare @Remaining bigint;
		
	create table #TempTable1(
		RowNumber int,
		GhabzOrHavale uniqueidentifier,
		Kind nvarchar(50),
		WarehouseDocType nvarchar(10),
		StuffName nvarchar(50), 
		GhabzOrHavaleNumber nvarchar(50), 
		GhabzOrHavaleDate varchar(10), 
		Customer nvarchar(50), 
		Enter bigint, 
		Export bigint, 
		Remaining bigint)			
	
	select @RowsCount = count(RowNumber) from #TempTable;

	select @I = 1 , @GhabzhaTotalPrice = 0, @RialiUnitPrice = 0,
		@Remaining = 0,@Enter = 0, @Export = 0

	while @I <= @RowsCount
	begin
		declare @RowNumber int;
		declare @GhabzOrHavale uniqueidentifier;
		declare @Kind nvarchar(50);
		declare @GhabzUnitPrice bigint;
	    declare @HavaleUnitPrice bigint;
		declare @GhabzTotalPrice bigint;
		declare @HavaleTotalPrice bigint;
		declare @StuffName nvarchar(50);
		declare @GhabzOrHavaleNumber nvarchar(50);
		declare @GhabzOrHavaleDate varchar(10);
		declare @Customer nvarchar(50);
		declare @WarehouseDocType nvarchar(10);
		
		select @Havale = HavaleID From #TempTable where RowNumber = @I
		select @Ghabz = GhabzID from #TempTable where RowNumber = @I
		select @RialiUnitPrice = case when @Remaining < 1 then 0 
			else  @GhabzhaTotalPrice / @Remaining end
			
		if @Havale is not null 
		begin 
			select	@GhabzOrHavale = @Havale ,
				@Kind = GhabzOrHavaleTypeTitle,
				@StuffName =StuffName,
				@Enter = 0, 
				@GhabzOrHavaleNumber = HavaleNumber, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = CustomerName,
				@WarehouseDocType = 'Havale',
				@Export = Export,
				@GhabzhaTotalPrice = @GhabzhaTotalPrice - ( Export * @RialiUnitPrice)
			from #TempTable 
			where RowNumber = @I			
		end
		else if @Ghabz is not null 
		begin 
			select	@GhabzOrHavale = @Ghabz ,
				@Kind = GhabzOrHavaleTypeTitle,
				@StuffName =StuffName,
				@Export = 0, 
				@GhabzOrHavaleNumber = GhabzNumber, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = SellerName,
				@Enter = Enter,
				@WarehouseDocType = 'Ghabz'
			from #TempTable 
			where RowNumber = @I							
		end
		else
		begin
			select	@GhabzOrHavale = '00000000-0000-0000-0000-000000000000' ,
				@Kind = GhabzOrHavaleTypeTitle,
				@StuffName =StuffName,
				@Export = Export, 
				@GhabzOrHavaleNumber = null, 
				@GhabzOrHavaleDate = IssueDate,
				@Customer = '-',
				@Enter = Enter,
				@WarehouseDocType = null
			from #TempTable 
			where RowNumber = @I
		end
		
		insert into #TempTable1(
			RowNumber,
			GhabzOrHavale,
			Kind ,		
			WarehouseDocType,	
			StuffName, 
			GhabzOrHavaleNumber, 
			GhabzOrHavaleDate, 
			Customer, 
			Enter, 
			Export, 
			Remaining )
		values(@I,
			@GhabzOrHavale,
			@Kind,
			@WarehouseDocType,
			@StuffName,
			@GhabzOrHavaleNumber, 
			@GhabzOrHavaleDate,
			@Customer,
			@Enter,
			@Export,
			0 )
		
		select @Enter = Enter, @Export = Export from #TempTable1 where RowNumber = @I
		select @Remaining =  (@Enter + @Remaining)  - @Export
		update #TempTable1 
		set Remaining = @Remaining			
		where RowNumber = @I 		
				
		select @I = @I + 1
	end

	select * from #TempTable1
	order by GhabzOrHavaleDate
	
end
go
--exec wm.KarteksTedadiKala '2017-3-21', '2018-3-20', '38337b64-309e-47ba-af19-6325e3029746', null, null, null, null

afw.BeforeAlterProc 'wm.CopyFinancialYearSettings'
go
alter procedure wm.CopyFinancialYearSettings
	@SourceFinancialYear uniqueidentifier, @DestinationFinancialYear uniqueidentifier as
begin
	insert into wm_WarehouseDocsAccSettingss(ID,
		FinancialYear,
		GhabzOrHavaleType,
		TarafHesabeAnbarAccount)
	select NEWID(),
		@DestinationFinancialYear,
		GhabzOrHavaleType,
		(select ID from acc_Accounts 
		 where SourceAccount = TarafHesabeAnbarAccount and
			FinancialYear = @DestinationFinancialYear)
	from wm_WarehouseDocsAccSettingss
	where FinancialYear = @SourceFinancialYear
end
go

afw.BeforeAlterView 'wm_VarianceGhabzOrHavaleStuffsReport'
go
alter view wm_VarianceGhabzOrHavaleStuffsReport as
	select * from  (
		select GhabzOrHavale.IssueDate, 
			afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_PersionText, 
			GhabzOrHavale.WarehouseDocType, 
            GhabzOrHavale.WarehouseDocType_Title, 
			GhabzOrHavale.GhabzOrHavaleType, 
			GhabzOrHavale.GhabzOrHavaleType_Title, 
            GhabzOrHavale.GhabzOrHavaleNumber, 
			GhabzOrHavale.OrganizationUnit, 
			GhabzOrHavale.OrgUnit_Name, 
			GhabzOrHavale.ReferenceDocType, 
            GhabzOrHavale.ReferenceDocType_Title, 
			GhabzOrHavaleItem.Stuff, 
			StuffDef.Name StuffDef_Name, 
			SalesInvoice.InvoiceNumber InvoiceNumber
		from wm_GhabzOrHavalehaView GhabzOrHavale 
			left join wm_GhabzOrHavaleItemsView GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID 
			LEFT JOIN cmn_StuffDefs StuffDef on StuffDef.ID = GhabzOrHavaleItem.StuffDef 
			cross apply(
				select SalesInvoice.*
                from ps_SalesInvoices SalesInvoice
                where SalesInvoice.ID = GhabzOrHavale.RefDoc_SalesInvoice 
					and RefDoc_SalesInvoice IS NOT NULL 
					and GhabzOrHavaleItem.Stuff 
					not in (
						select        Stuff
                        from            ps_SalesInvoiceItems
                        where        SalesInvoice = SalesInvoice.ID)
		) SalesInvoice
        union
        select GhabzOrHavale.IssueDate, 
			afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_PersionText, 
			GhabzOrHavale.WarehouseDocType, 
            GhabzOrHavale.WarehouseDocType_Title, 
			GhabzOrHavale.GhabzOrHavaleType, 
			GhabzOrHavale.GhabzOrHavaleType_Title, 
            GhabzOrHavale.GhabzOrHavaleNumber, 
			GhabzOrHavale.OrganizationUnit, 
			GhabzOrHavale.OrgUnit_Name, 
			GhabzOrHavale.ReferenceDocType, 
            GhabzOrHavale.ReferenceDocType_Title, 
			SalesInvoiceItem.Stuff, 
			StuffDef.Name StuffDef_Name, 
			BuyInvoice.InvoiceNumber InvoiceNumber
        from ps_SalesInvoiceItems SalesInvoiceItem 
			left join ps_SalesInvoices BuyInvoice on SalesInvoiceItem.SalesInvoice = BuyInvoice.ID 
			left join cmn_Stuffs Stuff on Stuff.ID = SalesInvoiceItem.Stuff 
			left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
			cross apply(
				select GhabzOrHavale.*
                from wm_GhabzOrHavalehaView GhabzOrHavale
                where GhabzOrHavale.ID = GhabzOrHavale.RefDoc_BuyInvoice 
					and RefDoc_BuyInvoice is not null 
					and SalesInvoiceItem.Stuff 
					not in(
						select Stuff
                        from            wm_GhabzOrHavaleItemsView
                        where        GhabzOrHavale = ID)
		) GhabzOrHavale
        union
        select GhabzOrHavale.IssueDate, 
			afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_PersionText, 
			GhabzOrHavale.WarehouseDocType, 
            GhabzOrHavale.WarehouseDocType_Title, 
			GhabzOrHavale.GhabzOrHavaleType, 
			GhabzOrHavale.GhabzOrHavaleType_Title, 
            GhabzOrHavale.GhabzOrHavaleNumber, 
			GhabzOrHavale.OrganizationUnit,
			GhabzOrHavale.OrgUnit_Name, 
			GhabzOrHavale.ReferenceDocType, 
            GhabzOrHavale.ReferenceDocType_Title, 
			GhabzOrHavaleItem.Stuff, 
			StuffDef.Name StuffDef_Name, 
            ReturnFromBuy.ReturnFromBuyNumber InvoiceNumber
        from wm_GhabzOrHavalehaView GhabzOrHavale 
			left join wm_GhabzOrHavaleItemsView GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID 
			left join cmn_StuffDefs StuffDef on StuffDef.ID = GhabzOrHavaleItem.StuffDef 
			cross apply(
				select ReturnFromBuy.*
				from ps_ReturnFromBuys ReturnFromBuy
				where ReturnFromBuy.ID = GhabzOrHavale.RefDoc_ReturnFromBuy 
					and RefDoc_SalesInvoice is not null 
					and GhabzOrHavaleItem.Stuff 
					not in(
						select Stuff
						from    ps_ReturnFromBuyItems
						where ReturnFromBuy = ReturnFromBuy.ID)
		) ReturnFromBuy
        union
        select GhabzOrHavale.IssueDate, 
			afw.GregorianToPersian(GhabzOrHavale.IssueDate) IssueDate_PersionText, 
			GhabzOrHavale.WarehouseDocType, 
            GhabzOrHavale.WarehouseDocType_Title, 
			GhabzOrHavale.GhabzOrHavaleType, 
			GhabzOrHavale.GhabzOrHavaleType_Title, 
            GhabzOrHavale.GhabzOrHavaleNumber, 
			GhabzOrHavale.OrganizationUnit, 
			GhabzOrHavale.OrgUnit_Name, 
			GhabzOrHavale.ReferenceDocType, 
            GhabzOrHavale.ReferenceDocType_Title, 
			ReturnFromSaleItem.Stuff, 
			StuffDef.Name StuffDef_Name, 
            ReturnFromSales.ReturnFromSalesNumber InvoiceNumber
        from ps_ReturnFromSaleItems ReturnFromSaleItem 
			left join ps_ReturnFromSales ReturnFromSales on ReturnFromSaleItem.SalesInvoiceItem = ReturnFromSales.ID 
			left join cmn_Stuffs Stuff on Stuff.ID = ReturnFromSaleItem.Stuff 
			left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
			cross apply(
				select GhabzOrHavale.*
					from wm_GhabzOrHavalehaView GhabzOrHavale
					where GhabzOrHavale.ID = GhabzOrHavale.RefDoc_ReturnFromSale 
						and RefDoc_ReturnFromSale is not null 
						and ReturnFromSaleItem.Stuff 
						not in(
							select Stuff
								from wm_GhabzOrHavaleItemsView
								where GhabzOrHavale = ID)
		) GhabzOrHavale
	) ResultQuery
where        ResultQuery.GhabzOrHavaleNumber <> 0
go