-- Indexes:
if not exists (select 1 from sys.indexes where name = 'IX_ps_SalesInvoices_OwnerUser__IsProforma__OrganizationUnit__FinancialYear')
	create index IX_ps_SalesInvoices_OwnerUser__IsProforma__OrganizationUnit__FinancialYear on ps_SalesInvoices(OwnerUser, IsProforma, OrganizationUnit, FinancialYear)
go
if not exists (select 1 from sys.indexes where name = 'IX_ps_SalesInvoices_IsProforma__OrganizationUnit__OwnerUser__FinancialYear')	
	create index IX_ps_SalesInvoices_IsProforma__OrganizationUnit__OwnerUser__FinancialYear on ps_SalesInvoices(IsProforma, OrganizationUnit, OwnerUser, FinancialYear)
go

if not exists (select 1 from sys.indexes where name = 'IX_ps_SalesInvoices_IsProforma__SourceProforma')
	create index IX_ps_SalesInvoices_IsProforma__SourceProforma on ps_SalesInvoices(IsProforma, SourceProforma)
-- created for ps.SalesProformaInvoices DataList query
go

if not exists (select 1 from sys.indexes where name = 'IX_ps_SalesInvoiceItems_SalesInvoice')
	create index IX_ps_SalesInvoiceItems_SalesInvoice on ps_SalesInvoiceItems(SalesInvoice)
-- created for ps.HavaleRequestItems DataList
go

afw.BeforeAlterSF 'ps.SalesProforma_DuplicateRequestNumberExists'
go
alter function ps.SalesProforma_DuplicateRequestNumberExists(
	@ProformaID uniqueidentifier,
	@ProformaOrganizationUnitID uniqueidentifier,
	@ProformaRequestNumber varchar(30),
	@ProformaInternalNumber1 bigint) returns bit as
begin
--declare @ProformaID uniqueidentifier
--declare @ProformaOrganizationUnitID uniqueidentifier
--declare @ProformaRequestNumber varchar(30)
--declare @ProformaInternalNumber1 bigint

--set @ProformaID = '4699EDF6-5D1E-4F4E-9823-000987CC926A'
--set @ProformaOrganizationUnitID = 'B574D189-C779-41CA-82B8-F12498CBE22B'
--set @ProformaRequestNumber = N'6649'
--set @ProformaInternalNumber1 = 2871

	declare @Result bit

	if exists(
		--پیش فاکتور نامرتبط، با همین شماره درخواست
		select Proforma.*
		from ps_SalesInvoices Proforma
		where Proforma.IsProforma = 1 
			and Proforma.OrganizationUnit = @ProformaOrganizationUnitID
			and isnull(Proforma.RequestNumber, '') = @ProformaRequestNumber
			and Proforma.InternalNumber1 <> @ProformaInternalNumber1)
		set @Result = 1
	else if exists(
		--فاکتور نامرتبط، با همین شماره درخواست (1)
		select Invoice.*
		from ps_SalesInvoices Invoice
		where Invoice.IsProforma = 0 
			and Invoice.SourceProforma is null
			and Invoice.OrganizationUnit = @ProformaOrganizationUnitID
			and isnull(Invoice.RequestNumber, '') = @ProformaRequestNumber)
		set @Result = 1
	else if exists(
		--فاکتور نامرتبط (شناسایی از طریق پیش فاکتور های مرتبط آن)، با همین شماره درخواست (2)
		select Invoice.*
		from ps_SalesInvoices Invoice
			inner join ps_SalesInvoices SourceProforma on SourceProforma.ID = Invoice.SourceProforma
			inner join ps_SalesInvoices RelatedProforma on RelatedProforma.OrganizationUnit = SourceProforma.OrganizationUnit
				and RelatedProforma.InternalNumber1 = SourceProforma.InternalNumber1
				and RelatedProforma.IsProforma = 1
		where Invoice.IsProforma = 0
			and RelatedProforma.InternalNumber1 <> @ProformaInternalNumber1
			and Invoice.OrganizationUnit = @ProformaOrganizationUnitID
			and isnull(Invoice.RequestNumber, '') = @ProformaRequestNumber)
		set @Result = 1

	if @Result is null
		set @Result = 0

	return @Result
end
go

afw.BeforeAlterSF 'ps.SalesInvoice_DuplicateRequestNumberExists'
go
alter function ps.SalesInvoice_DuplicateRequestNumberExists(
	@InvoiceID uniqueidentifier,
	@InvoiceOrganizationUnitID uniqueidentifier,
	@InvoiceRequestNumber varchar(30),
	@SourceProformaID uniqueidentifier) returns bit as
begin
--declare @InvoiceID uniqueidentifier
--declare @InvoiceOrganizationUnitID uniqueidentifier
--declare @InvoiceRequestNumber varchar(30)
--declare @SourceProformaID bigint

--set @InvoiceID = '4699EDF6-5D1E-4F4E-9823-000987CC926A'
--set @InvoiceOrganizationUnitID = 'B574D189-C779-41CA-82B8-F12498CBE22B'
--set @InvoiceRequestNumber = N'6649'
--set @SourceProformaID = 2871

	declare @Result bit

	if exists(
		-- فاکتور دیگر با همین شماره درخواست
		select Invoice.*
		from ps_SalesInvoices Invoice
		where Invoice.IsProforma = 0
			and Invoice.ID <> @InvoiceID 
			and Invoice.OrganizationUnit = @InvoiceOrganizationUnitID
			and isnull(Invoice.RequestNumber, '') = @InvoiceRequestNumber)
		set @Result = 1
	else if (@SourceProformaID = null)
	begin
		if exists(
			--پیش فاکتور نامرتبط، با همین شماره درخواست (1)
			select Proforma.*
			from ps_SalesInvoices Proforma
			where Proforma.IsProforma = 1 
				and Proforma.OrganizationUnit = @InvoiceOrganizationUnitID
				and isnull(Proforma.RequestNumber, '') = @InvoiceRequestNumber)
			set @Result = 1
	end
	else
	begin
		declare @SourceProformaInternalNumber1 bigint
		select @SourceProformaInternalNumber1 = InternalNumber1 from ps_SalesInvoices where ID = @SourceProformaID
	
		if exists(
			--پیش فاکتور نامرتبط، با همین شماره درخواست (2)
			select Proforma.*
			from ps_SalesInvoices Proforma
			where Proforma.IsProforma = 1
				and Proforma.OrganizationUnit = @InvoiceOrganizationUnitID
				and isnull(Proforma.RequestNumber, '') = @InvoiceRequestNumber
				and Proforma.InternalNumber1 <> @SourceProformaInternalNumber1)
			set @Result = 1
	end

	if @Result is null
		set @Result = 0

	return @Result
end
go

afw.BeforeAlterProc 'ps.KarteksTedadiKala'
go
alter procedure ps.KarteksTedadiKala
	@FromDate date, @ToDate date, @Stuff uniqueidentifier, @Person uniqueidentifier
as
begin
	create table #TempTable(
		RowNumber int,
		StuffName nvarchar(100), 
		StuffDef uniqueidentifier,
		SalesInvoice uniqueidentifier,
		BuyInvoice uniqueidentifier,
		BuyStuff uniqueidentifier,
		SaleStuff uniqueidentifier,
		BuyInvoiceNumber nvarchar(50),
		SalInvoiceNumber nvarchar(50),
		BuyIssueDate varchar(10),
		SalIssueDate varchar(10),
		Customer nvarchar(50),
		Seller nvarchar(50),
		BuyNote nvarchar(200),
		SaleNote nvarchar(200),
		Enter bigint,
		Export bigint,
		Remaining bigint)

	insert into #TempTable(RowNumber, StuffName, StuffDef,
		SalesInvoice, BuyInvoice, BuyStuff, SaleStuff, BuyInvoiceNumber,
		SalInvoiceNumber, BuyIssueDate, SalIssueDate, Customer, Seller, BuyNote,
		SaleNote, Enter, Export)      
	select ROW_NUMBER() over (order by SalesInvoices.IssueDate) RowNumber,
		StuffDefs.Name StuffName,
		Stuffs.StuffDef StuffDefID,
		SalesInvoiceItems.SalesInvoice,
		null BuyInvoice,
		null BuyInvoiceItems,
		SalesInvoiceItems.Stuff SalesInvoiceItems,
		null BuyInvoiceNumber,
		SalesInvoices.InvoiceNumber SalesInvoicesNumber,
		null BuyDate,
		substring (cast(afw.GregorianToPersian(SalesInvoices.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(SalesInvoices.IssueDate)) + 2) SalesDate,
		Customer.Name CustomerName,
		null SellerName,
		null BuyNote,
		SalesInvoices.Description SalesNote,
		null BuyQuantity,
		SalesInvoiceItems.Quantity SalesQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join ps_SalesInvoiceItems SalesInvoiceItems on Stuffs.ID = SalesInvoiceItems.Stuff
		inner join ps_SalesInvoices SalesInvoices on SalesInvoices.ID = SalesInvoiceItems.SalesInvoice
		inner join cmn_Persons Customer on Customer.ID = SalesInvoices.Customer
	where SalesInvoices.IsProforma = 0 
		and StuffDefs.ID = @Stuff 
		and (cast(SalesInvoices.IssueDate as date) >=  @FromDate and cast(SalesInvoices.IssueDate as date) <= @ToDate)
		or (Customer.ID = @Person)
	union all 
	select ROW_NUMBER() over (order by BuyInvoices.IssueDate) RowNumber,
		StuffDefs.Name StuffName,
		Stuffs.StuffDef StuffDefID,
		null SalesInvoice,
		BuyInvoiceItems.BuyInvoice,
		BuyInvoiceItems.Stuff BuyInvoiceItems,
		null SalesInvoiceItems,
		BuyInvoices.InvoiceNumber BuyInvoiceNumber,
		null SalesInvoicesNumber,
		substring (cast(afw.GregorianToPersian(BuyInvoices.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(BuyInvoices.IssueDate)) + 2) BuyDate,
		null SalesDate,
		null CustomerName,
		Seller.Name SellerName,
		BuyInvoices.Description BuyNote,
		null SalesNote,
		BuyInvoiceItems.Quantity BuyQuantity,
		null SalesQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join ps_BuyInvoiceItems BuyInvoiceItems on Stuffs.ID = BuyInvoiceItems.Stuff
		inner join ps_BuyInvoices BuyInvoices on BuyInvoices.ID = BuyInvoiceItems.BuyInvoice
		inner join cmn_Persons Seller on Seller.ID = BuyInvoices.Seller 
	where StuffDefs.ID = @Stuff 
		and (cast(BuyInvoices.IssueDate as date) >= @FromDate and cast(BuyInvoices.IssueDate as date) <= @ToDate)
		or (Seller.ID = @Person)
	order by StuffName

	declare @BuyInvoice uniqueidentifier;
	declare @SaleInvoice uniqueidentifier;
	declare @RowsCount int;
	declare @ID int;

	create table #TempTable1(RowNumber int,
		Invoice uniqueidentifier,
		Kind nvarchar(15),
		StuffName nvarchar(50), 
		InvoiceNumber nvarchar(50), 
		InvoiceDate varchar(10), 
		Customer nvarchar(50), 
		Note nvarchar(500), 
		Enter bigint, 
		Export bigint, 
		Remaining bigint)
	
	select @RowsCount = count(RowNumber) from #TempTable;
	select @ID = 1

	while @ID <= @RowsCount
	begin
		--declare @RowNumber int;
		declare @Invoice uniqueidentifier;
		declare @Kind nvarchar(15);
		declare @StuffName nvarchar(50);
		declare @InvoiceNumber nvarchar(50);
		declare @InvoiceDate varchar(10);
		declare @Customer nvarchar(50);
		declare @Note nvarchar(500);
		declare @Enter bigint;
		declare @Export bigint; 
		declare @Remaining bigint;
		select @BuyInvoice = BuyInvoice from #TempTable where RowNumber = @ID
		select @SaleInvoice = SalesInvoice from #TempTable where RowNumber = @ID
		
		if @SaleInvoice is not null 
		begin 
			select @Invoice = @SaleInvoice ,
				@Kind = N'فروش',
				@StuffName=StuffName,
				@Enter = 0, 
				@InvoiceNumber = SalInvoiceNumber, 
				@InvoiceDate = SalIssueDate,
				@Customer = Customer,
				@Note = SaleNote,
				@Export = Export
			from #TempTable where RowNumber = @ID
		end
		else if @BuyInvoice is not null 
		begin 
			select @Invoice = @BuyInvoice ,
				@Kind = N'خرید',
				@StuffName=StuffName,
				@Export = 0, 
				@InvoiceNumber = BuyInvoiceNumber, 
				@InvoiceDate = BuyIssueDate,
				@Customer = Seller,
				@Note = BuyNote,
				@Enter = Enter
			from #TempTable where RowNumber = @ID
		 end

		 insert into #TempTable1 (
			RowNumber,
			Invoice,
			Kind ,
			StuffName, 
			InvoiceNumber, 
			InvoiceDate, 
			Customer, 
			Note, 
			Enter, 
			Export, 
			Remaining)
		 values (
			@ID,
			@Invoice,
			@Kind,
			@StuffName,
			@InvoiceNumber, 
			@InvoiceDate,
			@Customer,
			@Note,
			@Enter,
			@Export,
			0)

		select @ID = @ID + 1
	end

	declare @RowsCountTable1 int;
	declare @IDTable1 int;
	select @RowsCountTable1 = count(RowNumber) from #TempTable1;
	select @IDTable1 = 0
	select @Remaining = 0,@Enter = 0, @Export = 0 

	while @IDTable1 <= @RowsCountTable1
	begin
		select @Enter = Enter, @Export = Export from #TempTable1 where RowNumber = @IDTable1 
		select @Remaining =  (@Enter + @Remaining)  - @Export
		update #TempTable1 set Remaining = @Remaining where RowNumber = @IDTable1 
		select @IDTable1 = @IDTable1 + 1
	end

	select * from #TempTable1
	order by InvoiceDate
end
go

afw.BeforeAlterProc 'ps.KarteksTedadiRialiKala'
go
alter procedure [ps].[KarteksTedadiRialiKala]
	@FromDate date, @ToDate date, @Stuff uniqueidentifier, @Person uniqueidentifier as
begin
	create Table #TempTable(
		RowNumber int,
		StuffName nvarchar(100), 
		StuffDef uniqueidentifier,
		SalesInvoice uniqueidentifier,
		BuyInvoice uniqueidentifier,
		BuyUnitPrice bigint,
		SaleUnitPrice bigint,
		BuyTotalPrice bigint,
		SaleTotalPrice bigint,
		BuyStuff uniqueidentifier,
		SaleStuff uniqueidentifier,
		BuyInvoiceNumber nvarchar(50),
		SalInvoiceNumber nvarchar(50),
		BuyIssueDate varchar(10),
		SalIssueDate varchar(10),
		Customer nvarchar(50),
		Seller nvarchar(50),
		BuyNote nvarchar(200),
		SaleNote nvarchar(200),
		Enter bigint,
		Export bigint,
		Remaining bigint)

	insert into #TempTable(RowNumber,
		StuffName,
		StuffDef,
		SalesInvoice,
		BuyInvoice ,
		BuyUnitPrice,
		SaleUnitPrice,
		BuyTotalPrice,
		SaleTotalPrice,
		BuyStuff ,
		SaleStuff,
		BuyInvoiceNumber,
		SalInvoiceNumber,
		BuyIssueDate,
		SalIssueDate ,
		Customer,
		Seller,
		BuyNote,
		SaleNote,
		Enter,
		Export)  
		        
	select ROW_NUMBER() over (order by Stuffs.StuffDef)RowNumber,
		StuffDefs.Name StuffName,
		Stuffs.StuffDef,
		SalesInvoiceItems.SalesInvoice SalesInvoiceItem,
		null BuyInvoiceItem,
		null BuyUnitPrice,
		SalesInvoiceItems.UnitPrice SalesUnitPrice,
		null BuyTotalPrice,
		SalesInvoiceItems.TotalPrice SalesTotalPrice,
		null BuyStuff,
		SalesInvoiceItems.Stuff SalesStuff,
		null BuyInvoiceNumber,
		SalesInvoices.InvoiceNumber SalesInvoiceNumber,
		null BuyDate,
		substring (cast(afw.GregorianToPersian(SalesInvoices.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(SalesInvoices.IssueDate)) + 2) SalesDate,
		Customer.Name CustomerName,
		null SellerName,
		null BuyDescription,
		SalesInvoices.Description SalesDescription,
		null BuyQuantity,
		SalesInvoiceItems.Quantity SalesQuantity
	from cmn_Stuffs Stuffs
		inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
		inner join ps_SalesInvoiceItems SalesInvoiceItems on Stuffs.ID = SalesInvoiceItems.Stuff
		inner join ps_SalesInvoices SalesInvoices on SalesInvoices.ID = SalesInvoiceItems.SalesInvoice
		inner join cmn_Persons Customer on Customer.ID = SalesInvoices.Customer
	where SalesInvoices.IsProforma = 0 
		and StuffDefs.ID = @Stuff 
		and (cast(SalesInvoices.IssueDate as date) >=  @FromDate and cast(SalesInvoices.IssueDate as date) <= @ToDate)
		or (Customer.ID = @Person)
	union all
	select	ROW_NUMBER() over (order by Stuffs.StuffDef)RowNumber,
			StuffDefs.Name StuffName,
			Stuffs.StuffDef,
			null SalesInvoiceItem,
			BuyInvoiceItems.BuyInvoice BuyInvoiceItem,
			BuyInvoiceItems.UnitPrice BuyUnitPrice,
			null SalesUnitPrice,
			BuyInvoiceItems.TotalPrice BuyTotalPrice,
			null SalesTotalPrice,
			BuyInvoiceItems.Stuff BuyStuff,
			null SalesStuff,
			BuyInvoices.InvoiceNumber BuyInvoiceNumber,
			null SalesInvoiceNumber,
			substring (cast(afw.GregorianToPersian(BuyInvoices.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(BuyInvoices.IssueDate)) + 2) BuyDate,
			null SalesDate,
			null CustomerName,
			Seller.Name SellerName,
			BuyInvoices.Description BuyDescription,
			null SalesDescription,
			BuyInvoiceItems.Quantity BuyQuantity,
			null SalesQuantity
	from	cmn_Stuffs Stuffs
			inner join cmn_StuffDefs StuffDefs on StuffDefs.ID = Stuffs.StuffDef
			inner join ps_BuyInvoiceItems BuyInvoiceItems on Stuffs.ID = BuyInvoiceItems.Stuff
			inner join ps_BuyInvoices BuyInvoices on BuyInvoices.ID = BuyInvoiceItems.BuyInvoice
			inner join cmn_Persons Seller on Seller.ID = BuyInvoices.Seller
	where	StuffDefs.ID = @Stuff 
			and (cast(BuyInvoices.IssueDate as date) >= @FromDate and cast(BuyInvoices.IssueDate as date) <= @ToDate)
			or (Seller.ID = @Person)
	order by StuffName

	declare @BuyInvoice uniqueidentifier;
	declare @SaleInvoice uniqueidentifier;
	declare @RowsCount int;
	declare @ID int;

	create table #TempTable1(
		RowNumber int,
		Invoice uniqueidentifier,
		Kind nvarchar(15),
		BuyUnitPrice bigint,
		SaleUnitPrice bigint,
		BuyTotalPrice bigint,
		SaleTotalPrice bigint,
		StuffName nvarchar(50), 
		InvoiceNumber nvarchar(50), 
		InvoiceDate varchar(10), 
		Customer nvarchar(50), 
		Note nvarchar(500), 
		Enter bigint, 
		Export bigint, 
		Remaining bigint)
	
	select @RowsCount = count(RowNumber) from #TempTable;

	select @ID = 1

	while @ID <= @RowsCount
	begin
		declare @RowNumber int;
		declare @Invoice uniqueidentifier;
		declare @Kind nvarchar(15);
		declare @BuyUnitPrice bigint;
	    declare @SaleUnitPrice bigint;
		declare @BuyTotalPrice bigint;
		declare @SaleTotalPrice bigint;
		declare @StuffName nvarchar(50);
		declare @InvoiceNumber nvarchar(50);
		declare @InvoiceDate varchar(10);
		declare @Customer nvarchar(50);
		declare @Note nvarchar(500);
		declare @Enter bigint;
		declare @Export bigint; 
		declare @Remaining bigint;

		select @BuyInvoice = BuyInvoice From #TempTable where RowNumber = @ID
		select @SaleInvoice = SalesInvoice from #TempTable where RowNumber = @ID
		
		if @SaleInvoice is not null 
		begin 
			select	@Invoice = @SaleInvoice ,
				@Kind = N'فروش',
				@BuyUnitPrice = 0,
				@SaleUnitPrice = SaleUnitPrice,
				@BuyTotalPrice = 0,
				@SaleTotalPrice = SaleTotalPrice,
				@StuffName=StuffName,
				@Enter = 0, 
				@InvoiceNumber = SalInvoiceNumber, 
				@InvoiceDate = SalIssueDate,
				@Customer = Customer,
				@Note = SaleNote,
				@Export = Export
			from #TempTable 
			where RowNumber = @ID
		end
		else if @BuyInvoice is not null 
		begin 
			select	@Invoice = @BuyInvoice ,
				@Kind = N'خرید',
				@BuyUnitPrice = BuyUnitPrice,
				@SaleUnitPrice = 0,
				@BuyTotalPrice = BuyTotalPrice,
				@SaleTotalPrice = 0,
				@StuffName=StuffName,
				@Export = 0, 
				@InvoiceNumber = BuyInvoiceNumber, 
				@InvoiceDate = BuyIssueDate,
				@Customer = Seller,
				@Note = BuyNote,
				@Enter = Enter
			from #TempTable 
			where RowNumber = @ID
		end

		insert into #TempTable1(
			RowNumber,
			Invoice,
			Kind ,
			BuyUnitPrice,
			SaleUnitPrice,
			BuyTotalPrice,
			SaleTotalPrice,
			StuffName, 
			InvoiceNumber, 
			InvoiceDate, 
			Customer, 
			Note, 
			Enter, 
			Export, 
			Remaining)
		values(@ID,
			@Invoice,
			@Kind,
			@BuyUnitPrice,
			@SaleUnitPrice,
			@BuyTotalPrice,
			@SaleTotalPrice,
			@StuffName,
			@InvoiceNumber, 
			@InvoiceDate,
			@Customer,
			@Note,
			@Enter,
			@Export,
			0)

		select @ID = @ID + 1
	end

	declare @RowsCountTable1 int;
	declare @IDTable1 int;

	select @RowsCountTable1 = count(RowNumber) from #TempTable1;
	select @IDTable1 = 0
	select @Remaining = 0,@Enter = 0, @Export = 0 

	while @IDTable1 <= @RowsCountTable1
	begin
		select @Enter = Enter, @Export = Export from #TempTable1 where RowNumber = @IDTable1 
		select @Remaining =  (@Enter + @Remaining)  - @Export
		update #TempTable1 set Remaining = @Remaining where RowNumber = @IDTable1 
		select @IDTable1 = @IDTable1 + 1
	end

	select * from #TempTable1
	order by InvoiceDate
end
go

afw.BeforeAlterView 'ps_ProformasView'
go
alter view ps_ProformasView as
	select Proforma.*,
		Customer.FullName Customer_Text,
		SalesCase.Title SalesCase_Text,
		afw.GregorianToPersian(Proforma.IssueDate) IssueDate_Text,
		afw.GregorianToPersian(Proforma.ValidityDate) ValidityDate_Text,
		PriceList.Title PriceList_Text,
		case when NextProforma.ID is null then 1 else 0 end as IsLastEdition,
		CreatedInvoice.InvoiceNumber CreatedInvoice_Number, 
		FinancialGroup.Title FinancialGroupTitle,
		case when exists(select ID from ps_SalesInvoicePayPlanItems where SalesInvoice = Proforma.ID) then N'دارد' else '' end PayConditions,
		CreatorUser.DisplayName CreatorUser_Name,
		(select Name from cmn_OrganizationInformations where ID = Proforma.OrganizationUnit) OrganizationUnit_Text
	from ps_FilteredSalesInvoices Proforma
		left join dbo.cmn_PersonsLookUpView Customer on Customer.ID = Proforma.Customer
		left join dbo.crm_SalesCases SalesCase on SalesCase.ID = Proforma.SalesCase
		left join dbo.ps_PriceLists PriceList on PriceList.ID = Proforma.PriceList
		left join dbo.ps_SalesInvoices NextProforma on NextProforma.InternalNumber1 = Proforma.InternalNumber1
			and NextProforma.FinancialYear = Proforma.FinancialYear
			and isnull(NextProforma.InternalNumber2, 0) = isnull(Proforma.InternalNumber2, 0) + 1        
		left join dbo.ps_SalesInvoices CreatedInvoice on CreatedInvoice.SourceProforma = Proforma.ID 
			and CreatedInvoice.IsProforma = 0
		inner join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = Proforma.FinancialGroup
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = Proforma.CreatorUser		
	where Proforma.IsProforma = 1
go

afw.BeforeAlterProc 'ps.GetVosoolMotalebatList'
go
ALTER proc ps.GetVosoolMotalebatList
@InvoiceID uniqueidentifier,
@TodayDate datetime,
@Tarikh7RozBad datetime

as begin
create table #TempVosol
(
    Name Varchar(50), 
    Des NVarchar(50), 
	PriceKol float ,
	UnitSar float ,
	PriceSarresid float ,
	UnitUnSar float ,
	PriceUnSar float,
	Regdate datetime
)
declare @FinalAmount bigint,@chekBargashtiSarresid bigint,@countBargashtiSarresid int,@chekeZemanat bigint,@customerID uniqueidentifier
declare @chekBargashtiSarresidNashde bigint,@countBargashtiSarresidNashde int
declare @kolForosh bigint,@priceEtebarForosh float,@chekMoallaghSarresid bigint,@countMoallaghSarresid int,@chekMoallaghSarresidNashde bigint
declare @countMoallaghSarresidNashde bigint,@Price1 bigint,@Price2 bigint,@price3 bigint ,@price4 bigint

select @FinalAmount=FinalAmount,@customerID=Customer
from ps_SalesInvoices
where ID=@InvoiceID

SELECT       @kolForosh= SUM(SalesInvoice.FinalAmount)
FROM            (SELECT        InternalNumber1, MAX(InternalNumber2) AS InternalNumber2
                          FROM            dbo.ps_SalesInvoices
                          WHERE        (IsProforma = 1)
                          GROUP BY InternalNumber1) AS lastSaleInvoice INNER JOIN
                         dbo.ps_SalesInvoices AS SalesInvoice ON lastSaleInvoice.InternalNumber1 = SalesInvoice.InternalNumber1 AND lastSaleInvoice.InternalNumber2 = SalesInvoice.InternalNumber2
where Customer=@customerID
 
print @customerID
insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('FinalAmount',N'مبلغ فاکتور جاری',@FinalAmount,0,0,0,0)

select @chekeZemanat= SUM(ChekeZemanat.Amount)*70/100 
from  rp_ChekeZemanateDaryafti  ChekeZemanat inner join
             dbo.afw_OptionSetItems  OptionSet ON ChekeZemanat.NoeChekeZemanat = OptionSet.ID
where Payer=@customerID/*(OptionSet.Name = N'noe1')*/


select @priceEtebarForosh=PriceEtebarForosh
FROM cmn_Persons
WHERE (ID = @customerID)

/*********************************/
set @price1=@kolForosh+@FinalAmount-@chekeZemanat
print @price1
if(@price1<=0)
begin
print '1'
insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Naghd',N'حداقل مبلغ واریزی قبل از تایید',0,0,0,0,0)
insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Chek',N'حداقل چک قبل از تایید',0,0,0,0,0)

end else begin
set @price2=@priceEtebarForosh-@chekeZemanat
set @price3=@price1-@price2
print @price2
print '***'
print @price3
if(@price3>0)begin
	insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Naghd',N'حداقل مبلغ واریزی قبل از تایید',@price3,0,0,0,0)
print '2'
end else
	insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Naghd',N'حداقل مبلغ واریزی قبل از تایید',0,0,0,0,0)

set @price4=@chekeZemanat-@kolForosh
print @price4
if(@price4<=0)
begin 
	insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Chek',N'حداقل چک قبل از تایید',@FinalAmount-@price3,0,0,0,0)
print '3'
end else begin

  if(@price3<0)begin
	insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Chek',N'حداقل چک قبل از تایید',@price1,0,0,0,0)
print '4'
 end else begin 
	insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Chek',N'حداقل چک قبل از تایید',(@FinalAmount-@price3)-@price4,0,0,0,0)
	print '5'
end 
end end 
/**********************/

--insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('FinalAmount',N'حداقل مبلغ واریزی قبل از تایید',@FinalAmount,0,0,0,0)
--insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('FinalAmount',N'حداقل چک قبل از تایید',@FinalAmount,0,0,0,0)
/* سررسید برگشتی*/
select  @chekBargashtiSarresid=COUNT(Cheques.ChequeNumber), @countBargashtiSarresid=SUM(Cheques.Amount) 
from dbo.rp_ReceivedCheques AS Cheques inner join
          dbo.afw_OptionSetItems OptionSet ON Cheques.ChequeStatus = OptionSet.ID
where (OptionSet.Name = N'BargashtBeMalekeCheque')  and Cheques.DueDate <= @TodayDate  
/* سررسیدنشده برگشتی*/
select  @chekBargashtiSarresidNashde=COUNT(Cheques.ChequeNumber), @countBargashtiSarresidNashde=SUM(Cheques.Amount) 
from dbo.rp_ReceivedCheques AS Cheques inner join
          dbo.afw_OptionSetItems OptionSet ON Cheques.ChequeStatus = OptionSet.ID
where (OptionSet.Name = N'BargashtBeMalekeCheque')  and Cheques.DueDate >= @TodayDate  

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar,Regdate)values('chekBargashti',N'چک برگشتی',@chekBargashtiSarresid-@chekBargashtiSarresidNashde,@countBargashtiSarresid,@chekBargashtiSarresid,@countBargashtiSarresidNashde,@chekBargashtiSarresidNashde,@TodayDate)

/* سررسید معلق*/
select  @chekMoallaghSarresid=COUNT(Cheques.ChequeNumber), @countMoallaghSarresid=SUM(Cheques.Amount) 
from dbo.rp_ReceivedCheques AS Cheques inner join
          dbo.afw_OptionSetItems OptionSet ON Cheques.ChequeStatus = OptionSet.ID
where (OptionSet.Name = N'Moallagh') and Cheques.DueDate <= @TodayDate 
/* سررسیدنشده معلق*/
select  @chekMoallaghSarresidNashde=COUNT(Cheques.ChequeNumber), @countMoallaghSarresidNashde=SUM(Cheques.Amount) 
from dbo.rp_ReceivedCheques AS Cheques inner join
          dbo.afw_OptionSetItems OptionSet ON Cheques.ChequeStatus = OptionSet.ID
where (OptionSet.Name = N'Moallagh') and Cheques.DueDate > @TodayDate 

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar,Regdate)values('ChekMoalagh',N'چک معلق',@chekMoallaghSarresid-@chekMoallaghSarresidNashde,@countMoallaghSarresid,@chekMoallaghSarresid,@countMoallaghSarresidNashde,@chekMoallaghSarresidNashde,@TodayDate)

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('MandeKol',N'مانده کل',0,0,0,0,0)

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('ElamiehMali',N'اعلامیه های مالی',0,0,0,0,0)

select @chekeZemanat= SUM(ChekeZemanat.Amount)
from   rp_ChekeZemanateDaryafti  ChekeZemanat inner join
             dbo.afw_OptionSetItems  OptionSet ON ChekeZemanat.NoeChekeZemanat = OptionSet.ID
where Payer=@customerID

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('ZemantName',N'ضمانتنامه مشتری',@chekeZemanat,0,0,0,0)

select @chekeZemanat= SUM(ChekeZemanat.Amount)*70/100 
from   rp_ChekeZemanateDaryafti  ChekeZemanat inner join
             dbo.afw_OptionSetItems  OptionSet ON ChekeZemanat.NoeChekeZemanat = OptionSet.ID
where Payer=@customerID

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Zemanat70DarSad',N'70درصد ضمانت',@chekeZemanat,0,0,0,0)

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('Etebar',N'جمع اعتبار',@priceEtebarForosh,0,0,0,0)

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('AsnadDaryaftani',N'اسناد دریافتنی',0,0,0,0,0)


select @kolForosh=Sum(FinalAmount)
from ps_SalesInvoices
where Customer=@customerID and MohlateErsalChek >= @TodayDate  

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('KamtarAzEntezar',N'چک های نرسیده کمتر از زمان انتظار',0,0,0,0,0)

select @kolForosh=Sum(FinalAmount)
from ps_SalesInvoices
where Customer=@customerID and MohlateErsalChek <= @TodayDate  

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('BishtarAzEntezar',N'چک های نرسیده بیشتر از زمان انتظار',0,0,0,0,0)


select @kolForosh=sum(Cheques.Amount)
from dbo.rp_ReceivedCheques Cheques INNER JOIN
         dbo.afw_OptionSetItems  OptionSet ON Cheques.ID = OptionSet.ID
where ((OptionSet.Name = N'Moallagh') 
		or (OptionSet.Name = N'DarJaryaneVosol')
		or (OptionSet.Name = N'AsnadeDaryaftani')) and Cheques.Payer=@customerID and Cheques.DueDate >= @TodayDate and Cheques.DueDate <= @Tarikh7RozBad
                         
insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('FinalAmount',N'اسناددریافتنی تا 7 روز آینده',0,0,0,0,0)


select @kolForosh=Sum(FinalAmount)
from ps_SalesInvoices
where Customer=@customerID and MohlatePardakht >= @TodayDate  and MohlatePardakht <= @Tarikh7RozBad

insert into #TempVosol(Name,Des,PriceKol,UnitSar,PriceSarresid,UnitUnSar,PriceUnSar)values('FinalAmount',N'فاکتور تا 7 روز آینده',0,0,0,0,0)

select * from #TempVosol

drop table #TempVosol

end
go

afw.BeforeAlterProc 'ps.GetGardesheKalahayeMoshtari'
go
Alter proc ps.GetGardesheKalahayeMoshtari
	@SalesBuyType varchar(5),
	@IssueDateBegin datetime,
	@IssueDateEnd datetime,
	@Person uniqueidentifier,
	@StuffLabel uniqueidentifier

as 
begin

select afw.GregorianToPersian(Invoice.IssueDate) IssueDate,
	N'فروش' SalesBuyType,
	StuffDef.Name StuffDef_Name,
	Item.Quantity SalesQuantity,
	Item.FinalPrice SalesPrice,
	null BuyQuantity,
	null BuyPrice
into #SalesInvoice
from cmn_Stuffs Stuf
	inner join cmn_StuffDefs StuffDef on StuffDef.ID = Stuf.StuffDef 
	inner join ps_SalesInvoiceItems Item on Item.Stuff = Stuf.ID 
	inner join ps_SalesInvoices Invoice on Invoice.ID = Item.SalesInvoice
where 
	 (@IssueDateBegin is null or Invoice.IssueDate >= @IssueDateBegin) and
	 (@IssueDateEnd is null or Invoice.IssueDate <= @IssueDateEnd) and
	 Invoice.Customer = @Person and
	 (@StuffLabel is null or StuffDef.StuffLabel = @StuffLabel)

select afw.GregorianToPersian(Invoice.IssueDate) IssueDate,
	N'خرید' SalesBuyType,
	StuffDef.Name StuffDef_Name,
	null SalesQuantity,
	null SalesPrice,
	Item.Quantity BuyQuantity,
	Item.FinalPrice BuyPrice	
into #BuyInvoice
from cmn_Stuffs Stuf
	inner join cmn_StuffDefs StuffDef on StuffDef.ID = Stuf.StuffDef 
	inner join ps_BuyInvoiceItems Item on Item.Stuff = Stuf.ID 
	inner join ps_BuyInvoices Invoice on Invoice.ID = Item.BuyInvoice
where 
	 (@IssueDateBegin is null or Invoice.IssueDate >= @IssueDateBegin) and
	 (@IssueDateEnd is null or Invoice.IssueDate <= @IssueDateEnd) and
	 Invoice.Seller = @Person and
	 (@StuffLabel is null or StuffDef.StuffLabel = @StuffLabel)

if @SalesBuyType = 'Sales'
	select * from #SalesInvoice
else if @SalesBuyType = 'Buy'
	select * from #BuyInvoice
else
begin
	select * from #SalesInvoice
	union all 
	select * from #BuyInvoice
end

drop table #SalesInvoice
drop table #BuyInvoice

end
go

afw.BeforeAlterProc 'ps.GetSalesAndBuyInvoices'
go
alter procedure [ps].[GetSalesAndBuyInvoices]
	@FromDate date,
	@ToDate date, 
	@FinancialYear uniqueidentifier,
	@FinancialGroup uniqueidentifier,
	@Person uniqueidentifier,
	@InvoiceType nvarchar(15),
	@FiltertExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@StartRecordNumber int,
	@MaxRecords int
as
begin 
	--set parameters whene they are null for report
	declare @ZeroUniqueidentifierValue nvarchar(50) = '00000000-0000-0000-0000-000000000000',@FinancialGroupText nvarchar(30)
	if @Person = @ZeroUniqueidentifierValue set @Person = null
	if @FinancialGroup = @ZeroUniqueidentifierValue set @FinancialGroup = null

	set fmtonly off
	if exists (select * from tempdb.dbo.sysobjects O where O.xtype in ('U') and O.ID = object_id(N'tempdb..#TempTable'))
			drop table #TempTable
		set nocount on;

	create table #TempTable (
		RowNumber int identity(1,1),
		Person uniqueidentifier,
		PersonName nvarchar(200),
		Invoice uniqueidentifier,
		InvoiceNumber nvarchar(10),
		TotalStuffAndServicesPrice bigint,
		GeneralDiscount bigint,
		StuffAndServicesTotalAmountAfterDiscount bigint,
		TotalTaxAndToll bigint,
		FinalAmount bigint,
		IssueDate nvarchar(15) ,
		DocType nvarchar(15),
		DocType_PersianText nvarchar(15),
		TotalRecordsCount int,
		TotalStuffAndServicesPriceSum bigint,
		GeneralDiscountSum bigint,	  
		StuffAndServicesTotalAmountAfterDiscountSum bigint,
		TotalTaxAndTollSum bigint,	  
		FinalAmountSum bigint)		  
	 
	create table #SalesAndBuyInvoiceTable (
		RowNumber int identity(1,1),
		Person uniqueidentifier,
		PersonName nvarchar(200),
		SaleInvoice uniqueidentifier,
		BuyInvoice uniqueidentifier,
		SaleInvoiceNumber nvarchar(10),
		BuyInvoiceNumber nvarchar(10),
		SaleTotalStuffAndServicesPrice bigint,
		BuyTotalStuffAndServicesPrice bigint,
		SaleGeneralDiscount bigint,
		BuyGeneralDiscount bigint,
		SaleStuffAndServicesTotalAmountAfterDiscount bigint,
		BuyStuffAndServicesTotalAmountAfterDiscount bigint,
		SaleTotalTaxAndToll bigint,
		BuyTotalTaxAndToll bigint,
		SaleFinalAmount bigint,
		BuyFinalAmount bigint,
		SaleIssueDate nvarchar(15) ,
		BuyIssueDate nvarchar(15) ,
		DocType nvarchar(15),
		DocType_PersianText nvarchar(15)) 

	insert into #SalesAndBuyInvoiceTable (--RowNumber,
		Person,
		PersonName,
		SaleInvoice,
		BuyInvoice,
		SaleInvoiceNumber ,
		BuyInvoiceNumber ,
		SaleTotalStuffAndServicesPrice ,
		BuyTotalStuffAndServicesPrice ,
		SaleGeneralDiscount ,
		BuyGeneralDiscount ,
		SaleStuffAndServicesTotalAmountAfterDiscount ,
		BuyStuffAndServicesTotalAmountAfterDiscount ,
		SaleTotalTaxAndToll ,
		BuyTotalTaxAndToll ,
		SaleFinalAmount ,
		BuyFinalAmount ,
		SaleIssueDate ,
		BuyIssueDate ,
		DocType,
		DocType_PersianText)
	select Person.ID,
		Person.FullName,
		null,
		BuyInvoice.ID,
		null,
		BuyInvoice.InvoiceNumber,
		null,
		BuyInvoice.TotalStuffAndServicesPrice,
		null,
		BuyInvoice.TotalDiscount,
		null,
		BuyInvoice.StuffAndServicesTotalAmountAfterDiscount ,
		null,
		BuyInvoice.TotalTaxAndToll,
		null,
		BuyInvoice.FinalAmount,
		null,
		/*substring (*/cast(afw.GregorianToPersian(BuyInvoice.IssueDate)as nvarchar) /*,0,len(afw.GregorianToPersian(BuyInvoice.IssueDate)) + 3)*/ ,
		'Buy',
		N'فاکتور خرید'
	from cmn_PersonsLookUpView Person 
		inner join ps_BuyInvoices BuyInvoice on Person.ID = BuyInvoice.Seller
	where cast(BuyInvoice.IssueDate as date) >=  @FromDate and cast(BuyInvoice.IssueDate as date) <= @ToDate and
		(@FinancialYear is null or BuyInvoice.FinancialYear = @FinancialYear) and
		(@FinancialGroup is null or BuyInvoice.FinancialGroup = @FinancialGroup) and
		(@Person is null or BuyInvoice.Seller = @Person)
	union  	
	select Person.ID,
		Person.FullName,
		SalesInvoice.ID,
		null,
		SalesInvoice.InvoiceNumber,
		null,
		SalesInvoice.TotalStuffAndServicesPrice,
		null,
		SalesInvoice.TotalDiscount,
		null,
		SalesInvoice.StuffAndServicesTotalAmountAfterDiscount,
		null ,
		SalesInvoice.TotalTaxAndToll,
		null,
		SalesInvoice.FinalAmount,
		null,
		/*substring (*/cast(afw.GregorianToPersian(SalesInvoice.IssueDate)as nvarchar)/* ,0,len(afw.GregorianToPersian(SalesInvoice.IssueDate)) + 3)*/ ,
		null,
		'Sales',
		N'فاکتور فروش'
	from  cmn_PersonsLookUpView Person
		inner join ps_SalesInvoices SalesInvoice on Person.ID = SalesInvoice.Customer
	where cast(SalesInvoice.IssueDate as date) >=  @FromDate and cast(SalesInvoice.IssueDate as date) <= @ToDate and
		SalesInvoice.IsProforma = 0 and
		(@FinancialYear is null or SalesInvoice.FinancialYear = @FinancialYear) and
		(@FinancialGroup is null or SalesInvoice.FinancialGroup = @FinancialGroup) and
		(@Person is null or SalesInvoice.Customer = @Person) 
		--order by AccDoc.IssueDate, AccDoc.DocNo, AccDocItem.CreditorAmount
	
	declare @RowNumber int ,
		@PersonTempTable uniqueidentifier,
		@PersonName nvarchar(200),
		@Invoice uniqueidentifier,
		@InvoiceNumber nvarchar(10),
		@TotalStuffAndServicesPrice bigint,
		@GeneralDiscount bigint,
		@StuffAndServicesTotalAmountAfterDiscount bigint,
		@TotalTaxAndToll bigint,
		@FinalAmount bigint,
		@IssueDate nvarchar(15) ,
		@DocType nvarchar(15)		

	declare @RowNumberSalesAndbuy int ,
		@PersonSalesAndbuy uniqueidentifier,
		@PersonNameSalesAndbuy nvarchar(200),
		@SaleInvoice uniqueidentifier,
		@BuyInvoice uniqueidentifier,
		@SaleInvoiceNumber nvarchar(10),
		@BuyInvoiceNumber nvarchar(10),
		@SaleTotalStuffAndServicesPrice bigint,
		@BuyTotalStuffAndServicesPrice bigint,
		@SaleGeneralDiscount bigint,
		@BuyGeneralDiscount bigint,
		@SaleStuffAndServicesTotalAmountAfterDiscount bigint,
		@BuyStuffAndServicesTotalAmountAfterDiscount bigint,
		@SaleTotalTaxAndToll bigint,
		@BuyTotalTaxAndToll bigint,
		@SaleFinalAmount bigint,
		@BuyFinalAmount bigint,
		@SaleIssueDate nvarchar(15) ,
		@BuyIssueDate nvarchar(15) ,
		@DocTypeSalesAndbuy nvarchar(15),
		@DocType_PersianText nvarchar(15)

	declare tempTableCursor cursor 
	for select RowNumber,
		Person,
		PersonName,
		SaleInvoice,
		BuyInvoice,
		SaleInvoiceNumber ,
		BuyInvoiceNumber ,
		SaleTotalStuffAndServicesPrice ,
		BuyTotalStuffAndServicesPrice ,
		SaleGeneralDiscount ,
		BuyGeneralDiscount ,
		SaleStuffAndServicesTotalAmountAfterDiscount ,
		BuyStuffAndServicesTotalAmountAfterDiscount ,
		SaleTotalTaxAndToll ,
		BuyTotalTaxAndToll ,
		SaleFinalAmount ,
		BuyFinalAmount ,
		SaleIssueDate ,
		BuyIssueDate ,
		DocType ,
		DocType_PersianText
	from #SalesAndBuyInvoiceTable

	open tempTableCursor
	
	fetch next from tempTableCursor
	into @RowNumberSalesAndbuy  ,
		@PersonSalesAndbuy ,
		@PersonNameSalesAndbuy ,
		@SaleInvoice ,
		@BuyInvoice ,
		@SaleInvoiceNumber ,
		@BuyInvoiceNumber ,
		@SaleTotalStuffAndServicesPrice ,
		@BuyTotalStuffAndServicesPrice ,
		@SaleGeneralDiscount ,
		@BuyGeneralDiscount ,
		@SaleStuffAndServicesTotalAmountAfterDiscount ,
		@BuyStuffAndServicesTotalAmountAfterDiscount ,
		@SaleTotalTaxAndToll ,
		@BuyTotalTaxAndToll ,
		@SaleFinalAmount ,
		@BuyFinalAmount ,
		@SaleIssueDate  ,
		@BuyIssueDate  ,
		@DocTypeSalesAndbuy,
		@DocType_PersianText

	while @@FETCH_STATUS = 0
	begin
		if @SaleInvoice is not null set @Invoice = @SaleInvoice  else if @BuyInvoice is not null set @Invoice = @BuyInvoice 
		if @SaleInvoiceNumber is not null set @InvoiceNumber = @SaleInvoiceNumber  else if @BuyInvoiceNumber is not null set @InvoiceNumber = @BuyInvoiceNumber 
		if @SaleTotalStuffAndServicesPrice is not null  set @TotalStuffAndServicesPrice = @SaleTotalStuffAndServicesPrice  else if @BuyTotalStuffAndServicesPrice is not null set @TotalStuffAndServicesPrice = @BuyTotalStuffAndServicesPrice 
		if @SaleGeneralDiscount is not null set @GeneralDiscount = @SaleGeneralDiscount  else if @BuyGeneralDiscount is not null set @GeneralDiscount = @BuyGeneralDiscount 
		if @SaleStuffAndServicesTotalAmountAfterDiscount is not null set @StuffAndServicesTotalAmountAfterDiscount = @SaleStuffAndServicesTotalAmountAfterDiscount  else if @BuyStuffAndServicesTotalAmountAfterDiscount is not null set @StuffAndServicesTotalAmountAfterDiscount = @BuyStuffAndServicesTotalAmountAfterDiscount 
		if @SaleTotalTaxAndToll is not null set @TotalTaxAndToll = @SaleTotalTaxAndToll  else if @BuyTotalTaxAndToll is not null set @TotalTaxAndToll = @BuyTotalTaxAndToll 
		if @SaleFinalAmount is not null set @FinalAmount = @SaleFinalAmount  else if @BuyFinalAmount is not null set @FinalAmount = @BuyFinalAmount 
		if @SaleIssueDate is not null set @IssueDate = @SaleIssueDate  else if @BuyIssueDate is not null set @IssueDate = @BuyIssueDate 
		--if @DocTypeSalesAndbuy = 'Sale' set @DocType = N'فروش' else if @DocTypeSalesAndbuy = 'Buy' set @DocType = N'خرید'

		insert into #TempTable (
			Person ,
			PersonName ,
			Invoice ,
			InvoiceNumber ,
			TotalStuffAndServicesPrice,
			GeneralDiscount ,
			StuffAndServicesTotalAmountAfterDiscount,
			TotalTaxAndToll ,
			FinalAmount ,
			IssueDate ,
			DocType ,
			DocType_PersianText)
		values (
			@PersonSalesAndbuy,
			@PersonNameSalesAndbuy,
			@Invoice,
			@InvoiceNumber,
			@TotalStuffAndServicesPrice,
			@GeneralDiscount,
			@StuffAndServicesTotalAmountAfterDiscount,
			@TotalTaxAndToll,
			@FinalAmount,
			@IssueDate,
			@DocTypeSalesAndbuy,
			@DocType_PersianText)

		fetch next from tempTableCursor		
	    into @RowNumberSalesAndbuy,@PersonSalesAndbuy,@PersonNameSalesAndbuy,@SaleInvoice,@BuyInvoice,@SaleInvoiceNumber,
			@BuyInvoiceNumber,@SaleTotalStuffAndServicesPrice,@BuyTotalStuffAndServicesPrice,@SaleGeneralDiscount,@BuyGeneralDiscount,
			@SaleStuffAndServicesTotalAmountAfterDiscount,@BuyStuffAndServicesTotalAmountAfterDiscount,@SaleTotalTaxAndToll,@BuyTotalTaxAndToll ,
			@SaleFinalAmount,@BuyFinalAmount,@SaleIssueDate,@BuyIssueDate,@DocTypeSalesAndbuy ,@DocType_PersianText
	end

	close tempTableCursor 

	deallocate tempTableCursor
	
	declare @InvoiceKind nvarchar(100)
	
	if @FiltertExpression is null set @FiltertExpression = N'and 1 = 1'
	if @SortExpression is null set @SortExpression = N'RowNumber'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000
	
	if @InvoiceType is not null begin
									 --set @InvoiceKind = 'DocType = '+''+@InvoiceType+''
									if @InvoiceType = 'Buy' set @InvoiceKind = 'DocType = '+''''+'Buy'+''''
									if @InvoiceType = 'Sales' set @InvoiceKind = 'DocType = '+''''+'Sales'+''''
								end
	 if @InvoiceType is null 
		set @InvoiceKind = N'1 = 1'
		
	update #TempTable
	set TotalRecordsCount = (select count(1) from #TempTable),
		TotalStuffAndServicesPriceSum = (select sum(TotalStuffAndServicesPrice) from #TempTable where DocType = @InvoiceType),
		GeneralDiscountSum = (select sum(GeneralDiscount) from #TempTable where DocType = @InvoiceType),
		StuffAndServicesTotalAmountAfterDiscountSum = (select sum(StuffAndServicesTotalAmountAfterDiscount) from #TempTable where DocType = @InvoiceType),
		TotalTaxAndTollSum = (select sum(TotalTaxAndToll) from #TempTable where DocType = @InvoiceType),
		FinalAmountSum = (select sum(FinalAmount) from #TempTable where DocType = @InvoiceType)
	--apply paging:
	declare @PagingSqlQuery nvarchar(4000)
	set @PagingSqlQuery = '
		select top ' + cast(@MaxRecords as nvarchar) + ' *
		from (
			select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
			from (
				select * 
				from #TempTable
				where '+ @InvoiceKind+ ' '+ @FiltertExpression + ' ' +
			') NotPagedQuery
		) NotPagedQuery2
		where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
		'order by NotPagedQuery2._PagingRowNumber '
	
	print @PagingSqlQuery
	print @MaxRecords
	exec (@PagingSqlQuery)
	
	--select * from #TempTable 
end
go


afw.BeforeAlterView 'ps_SaleAndBuyInvoiceDetailsReportView'
go
alter view ps_SaleAndBuyInvoiceDetailsReportView as
	select BuyInvoice.ID,
		FinancialDocType.Title FinancialDocType_Text,
		FinancialDocType.ID FinancialDocType_ID,
		CreatorUser.DisplayName CreatorUser_Text, 
		CreatorUser.ID CreatorUser_ID, 
		null SourceProforma_CreatorUser_Text, 
		null SourceProforma_CreatorUser_ID,
		afw.GregorianToPersian(BuyInvoice.IssueDate) IssueDate_Persian, 
		BuyInvoice.IssueDate IssueDate,
		CustomerOrSeller.FullName CustomerOrSeller_Text,
		CustomerOrSeller.ID CustomerOrSeller_ID,
		State.Name CustomerOrSellerState,
		State.ID StateID,
		City.Name CustomerOrSellerCity, 
		City.ID CityID,
		case when DocKind.Title is null then
			isnull(DocKind.Title, 
				(select DocKind.Title  
				from acc_DocKinds DocKind 
				where DocKind.Name = 'BuyInvoice')
			)
			else DocKind.Title
		end DocKind_Title,
		StuffDef.TechnicalName, 
		StuffDef.Name StuffDef_Text,
		StuffDef.ID StuffDef_ID,
		BuyInvoiceItem.Quantity,
		BuyInvoiceItem.UnitPrice,
		BuyInvoiceItem.TotalPrice, 
		BuyInvoiceItem.TotalPriceAfterDiscount, 
		case when isnull(BuyInvoiceItem.Quantity, 0) > 0 then 
			BuyInvoiceItem.TotalPriceAfterDiscount/BuyInvoiceItem.Quantity 
			else 0 
		end Discount, 
		BuyInvoiceItem.TaxAndToll, 
		BuyInvoice.InvoiceNumber, 
		null RequestNumber,
		MainGroup.Name MainGroup_Name,
		MainGroup.ID MainGroup_ID,  
		SubGroup1.Name SubGroup1_Name,
		SubGroup1.ID SubGroup1_ID,
		SubGroup2.Name SubGroup2_Name,
		SubGroup2.ID SubGroup2_ID,
		StuffMainCategory.Title MainCategoryTitle,
		StuffMainCategory.ID MainCategoryID,
		StuffSubCategory.Title SubCategoryTitle, 
		StuffSubCategory.ID SubCategoryID, 
		StuffDef.Custom_TavanKva, 
		StuffDef.Custom_Esteghrar, 
		StuffDef.Custom_Phase,
		StuffDef.Model, 
		StuffDef.Brand,
		StuffDef.Custom_Battery, 
		case when DocKind.Name is null then
			isnull(DocKind.Name, 'BuyInvoice')
			else DocKind.Name
		end DocKind_Name, 
		StuffDef.Custom_CodeAnbar Custom_CodeAnbar,
		StuffDef.Custom_CodeHesabdari Custom_CodeHesabdari, 
		BuyInvoice.FinancialYear
	from ps_BuyInvoices BuyInvoice 
		left join cmn_PersonsLookUpView CustomerOrSeller on CustomerOrSeller.ID = BuyInvoice.Seller 
		left join cmn_Persons Person on Person.ID = BuyInvoice.Seller 
		left join cmn_Person_CustomerInfos CustomerInfo on CustomerInfo.Person = Person.ID 
		left join cmn_CustomerCategories MainGroup on MainGroup.ID = CustomerInfo.MainGroup 
		left join cmn_CustomerCategories SubGroup1 on SubGroup1.ID = CustomerInfo.SubGroup1 
		left join cmn_CustomerCategories SubGroup2 on SubGroup2.ID = CustomerInfo.SubGroup2 
		left join cmn_Cities City on City.ID = Person.City 
		left join cmn_States State on State.ID = Person.State 
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = BuyInvoice.CreatorUser
		left join acc_AccDocs AccDoc on AccDoc.ID = BuyInvoice.AccDoc 
		left join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind 
		left join ps_BuyInvoiceItems BuyInvoiceItem on BuyInvoiceItem.BuyInvoice = BuyInvoice.ID 
		left join cmn_Stuffs Stuff on Stuff.ID = BuyInvoiceItem.Stuff 
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
		left join cmn_StuffSubCategories StuffSubCategory on StuffSubCategory.ID = StuffDef.SubCategory
		left join cmn_StuffMainCategories StuffMainCategory on StuffMainCategory.ID = StuffSubCategory.MainCategory
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = BuyInvoice.FinancialDocType
	union all
	select SalesInvoice.ID, 
		FinancialDocType.Title FinancialDocType_Text,
		FinancialDocType.ID FinancialDocType_ID,
		CreatorUser.DisplayName CreatorUser_Text, 
		CreatorUser.ID CreatorUser_ID, 
		SourceProforma_CreatorUser.DisplayName SourceProforma_CreatorUser_Text, 
		SourceProforma_CreatorUser.ID SourceProforma_CreatorUser_ID, 
		afw.GregorianToPersian(SalesInvoice.IssueDate) IssueDate_Persian, 
		SalesInvoice.IssueDate IssueDate,
		Customer.FullName Customer_Text,Customer.ID Customer_ID,
		State.Name CustomerState,
		State.ID StateID,
		City.Name CustomerCity, 
		City.ID CityID,
		case when DocKind.Title is null then
			isnull(DocKind.Title, 
				(select DocKind.Title  
				from acc_DocKinds DocKind 
				where DocKind.Name = 'SalesInvoice')
			)
			else DocKind.Title
		end DocKind_Title, 
		StuffDef.TechnicalName, 
		isnull(StuffDef.Name, Service.Name) StuffDef_Text,
		StuffDef.ID StuffDef_ID, 
		SalesInvoiceItem.Quantity,
		SalesInvoiceItem.UnitPrice, SalesInvoiceItem.TotalPrice, SalesInvoiceItem.TotalPriceAfterDiscount, 
		case when isnull(SalesInvoiceItem.Quantity, 0) > 0 then 
			SalesInvoiceItem.TotalPriceAfterDiscount/SalesInvoiceItem.Quantity 
			else 0 
		end Discount, 
		SalesInvoiceItem.TaxAndToll, SalesInvoice.InvoiceNumber, SalesInvoice.RequestNumber, MainGroup.Name MainGroup_Name,
		MainGroup.ID MainGroup_ID,  
		SubGroup1.Name SubGroup1_Name,
		SubGroup1.ID SubGroup1_ID,
		SubGroup2.Name SubGroup2_Name,
		SubGroup2.ID SubGroup2_ID,
		StuffMainCategory.Title MainCategoryTitle,
		StuffMainCategory.ID MainCategoryID,
		StuffSubCategory.Title SubCategoryTitle, 
	    StuffSubCategory.ID SubCategoryID, 
		StuffDef.Custom_TavanKva, StuffDef.Custom_Esteghrar, StuffDef.Custom_Phase, StuffDef.Model, StuffDef.Brand, StuffDef.Custom_Battery, 
		case when DocKind.Name is null then isnull(DocKind.Name, 'SalesInvoice')
			else DocKind.Name
		end DocKind_Name, 
		StuffDef.Custom_CodeAnbar Custom_CodeAnbar, 
		StuffDef.Custom_CodeHesabdari Custom_CodeHesabdari, 
		SalesInvoice.FinancialYear
	from ps_SalesInvoices SalesInvoice 
		left join cmn_PersonsLookUpView Customer on Customer.ID = SalesInvoice.Customer 
		left join cmn_Persons Person on Person.ID = SalesInvoice.Customer 
		left join cmn_Person_CustomerInfos CustomerInfo on CustomerInfo.Person = Person.ID 
		left join cmn_CustomerCategories MainGroup on MainGroup.ID = CustomerInfo.MainGroup 
		left join cmn_CustomerCategories SubGroup1 on SubGroup1.ID = CustomerInfo.SubGroup1 
		left join cmn_CustomerCategories SubGroup2 on SubGroup2.ID = CustomerInfo.SubGroup2 
		left join cmn_Cities City on City.ID = Person.City 
		left join cmn_States State on State.ID = Person.State 
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = SalesInvoice.CreatorUser
		left join ps_SalesInvoices SourceProforma on SourceProforma.ID = SalesInvoice.SourceProforma	
		left join afw_SystemUsersView SourceProforma_CreatorUser on SourceProforma_CreatorUser.ID = SourceProforma.CreatorUser
		left join acc_AccDocs AccDoc on AccDoc.ID = SalesInvoice.AccDoc 
		left join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind 
		left join ps_SalesInvoiceItems SalesInvoiceItem on SalesInvoiceItem.SalesInvoice = SalesInvoice.ID 
		left join cmn_Stuffs Stuff on Stuff.ID = SalesInvoiceItem.Stuff 
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
		left join cmn_StuffSubCategories StuffSubCategory on StuffSubCategory.ID = StuffDef.SubCategory
		left join cmn_StuffMainCategories StuffMainCategory on StuffMainCategory.ID = StuffSubCategory.MainCategory
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = SalesInvoice.FinancialDocType
		left join cmn_Services Service on Service.ID = SalesInvoiceItem.Service
	where SalesInvoice.IsProforma = 0
	union all
	select ReturnFromSale.ID, 
		FinancialDocType.Title FinancialDocType_Text,
		FinancialDocType.ID FinancialDocType_ID,
		CreatorUser.DisplayName CreatorUser_Text, 
		CreatorUser.ID CreatorUser_ID, 
		null SourceProforma_CreatorUser_Text, 
		null SourceProforma_CreatorUser_ID,		
		afw.GregorianToPersian(ReturnFromSale.IssueDate) IssueDate_Persian, 
		ReturnFromSale.IssueDate IssueDate,
		CustomerOrSeller.FullName CustomerOrSeller_Text,
		CustomerOrSeller.ID CustomerOrSeller_ID,
		State.Name CustomerOrSellerState,
		State.ID StateID,
		City.Name CustomerOrSellerCity, 
		City.ID CityID,
		case when DocKind.Title is null then
			isnull(DocKind.Title, 
				(select DocKind.Title  
				from acc_DocKinds DocKind 
				where DocKind.Name = 'ReturnFromSalesInvoice')
			)
			else DocKind.Title
		end DocKind_Title, 
		StuffDef.TechnicalName, 
		isnull(StuffDef.Name, Service.Name) StuffDef_Text,
		StuffDef.ID StuffDef_ID,
		ReturnFromSaleItem.Quantity,
		ReturnFromSaleItem.UnitPrice, ReturnFromSaleItem.TotalPrice, ReturnFromSaleItem.TotalPriceAfterDiscount, 
		case when isnull(ReturnFromSaleItem.Quantity, 0) > 0 then 
			ReturnFromSaleItem.TotalPriceAfterDiscount/ReturnFromSaleItem.Quantity 
			else 0 
		end Discount, 
		ReturnFromSaleItem.TaxAndToll, ReturnFromSale.ReturnFromSalesNumber InvoiceNumber, null RequestNumber, MainGroup.Name MainGroup_Name,
		MainGroup.ID MainGroup_ID,  
		SubGroup1.Name SubGroup1_Name,
		SubGroup1.ID SubGroup1_ID,SubGroup2.Name SubGroup2, SubGroup2.ID SubGroup2_ID,StuffMainCategory.Title MainCategoryTitle,
		StuffMainCategory.ID MainCategoryID,
		StuffSubCategory.Title SubCategoryTitle, 
		StuffSubCategory.ID SubCategoryID, 
		StuffDef.Custom_TavanKva, StuffDef.Custom_Esteghrar, StuffDef.Custom_Phase, StuffDef.Model, StuffDef.Brand, StuffDef.Custom_Battery, 
		case when DocKind.Name is null then
			isnull(DocKind.Name, 'ReturnFromSalesInvoice')
			else DocKind.Name
		end DocKind_Name, 
		StuffDef.Custom_CodeAnbar Custom_CodeAnbar, StuffDef.Custom_CodeHesabdari Custom_CodeHesabdari, ReturnFromSale.FinancialYear	
	from ps_ReturnFromSales ReturnFromSale 
		left join cmn_PersonsLookUpView CustomerOrSeller on CustomerOrSeller.ID = ReturnFromSale.Customer 
		left join cmn_Persons Person on Person.ID = ReturnFromSale.Customer 
		left join cmn_Person_CustomerInfos CustomerInfo on CustomerInfo.Person = Person.ID 
		left join cmn_CustomerCategories MainGroup on MainGroup.ID = CustomerInfo.MainGroup 
		left join cmn_CustomerCategories SubGroup1 on SubGroup1.ID = CustomerInfo.SubGroup1 
		left join cmn_CustomerCategories SubGroup2 on SubGroup2.ID = CustomerInfo.SubGroup2 
		left join cmn_Cities City on City.ID = Person.City 
		left join cmn_States State on State.ID = Person.State 
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = ReturnFromSale.CreatorUser
		left join acc_AccDocs AccDoc on AccDoc.ID = ReturnFromSale.AccDoc 
		left join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind 
		left join ps_ReturnFromSaleItems ReturnFromSaleItem on ReturnFromSaleItem.ReturnFromSale = ReturnFromSale.ID 
		left join cmn_Stuffs Stuff on Stuff.ID = ReturnFromSaleItem.Stuff 
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
		left join cmn_StuffSubCategories StuffSubCategory on StuffSubCategory.ID = StuffDef.SubCategory
		left join cmn_StuffMainCategories StuffMainCategory on StuffMainCategory.ID = StuffSubCategory.MainCategory
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReturnFromSale.FinancialDocType
		left join cmn_Services Service on Service.ID = ReturnFromSaleItem.Service
	union all
	select ReturnFromBuy.ID, 
		FinancialDocType.Title FinancialDocType_Text,
		FinancialDocType.ID FinancialDocType_ID,
		CreatorUser.DisplayName CreatorUser_Text, 
		CreatorUser.ID CreatorUser_ID, 
		null SourceProforma_CreatorUser_Text, 
		null SourceProforma_CreatorUser_ID,		
		afw.GregorianToPersian(ReturnFromBuy.IssueDate) IssueDate_Persian, 
		ReturnFromBuy.IssueDate IssueDate,
		CustomerOrSeller.FullName CustomerOrSeller_Text,
		CustomerOrSeller.ID CustomerOrSeller_ID,
		State.Name CustomerOrSellerState,
		State.ID StateID,
		City.Name CustomerOrSellerCity, 
		City.ID CityID,
		case when DocKind.Title is null then
			isnull(DocKind.Title, 
				(select DocKind.Title  
				from acc_DocKinds DocKind 
				where DocKind.Name = 'ReturnFromBuyInvoice')
			)
			else DocKind.Title
		end DocKind_Title, StuffDef.TechnicalName, StuffDef.Name StuffDef_Text,StuffDef.ID StuffDef_ID,
		ReturnFromBuyItem.Quantity,
		ReturnFromBuyItem.UnitPrice, ReturnFromBuyItem.TotalPrice, ReturnFromBuyItem.TotalPriceAfterDiscount, 
		case when isnull(ReturnFromBuyItem.Quantity, 0) > 0 then 
			ReturnFromBuyItem.TotalPriceAfterDiscount/ReturnFromBuyItem.Quantity 
			else 0 
		end Discount, 
		ReturnFromBuyItem.TaxAndToll, ReturnFromBuy.ReturnFromBuyNumber InvoiceNumber, null RequestNumber, MainGroup.Name MainGroup_Name,
		MainGroup.ID MainGroup_ID,  
		SubGroup1.Name SubGroup1_Name,
		SubGroup1.ID SubGroup1_ID,SubGroup2.Name SubGroup2, SubGroup2.ID SubGroup2_ID,StuffMainCategory.Title MainCategoryTitle,
		StuffMainCategory.ID MainCategoryID,
		StuffSubCategory.Title SubCategoryTitle, 
		StuffSubCategory.ID SubCategoryID, 
		StuffDef.Custom_TavanKva, StuffDef.Custom_Esteghrar, StuffDef.Custom_Phase, StuffDef.Model, StuffDef.Brand, StuffDef.Custom_Battery, 
		case when DocKind.Name is null then
			isnull(DocKind.Name, 'ReturnFromBuyInvoice')
			else DocKind.Name
		end DocKind_Name, 
		StuffDef.Custom_CodeAnbar Custom_CodeAnbar, StuffDef.Custom_CodeHesabdari Custom_CodeHesabdari, ReturnFromBuy.FinancialYear	
	from ps_ReturnFromBuys ReturnFromBuy 
		left join cmn_PersonsLookUpView CustomerOrSeller on CustomerOrSeller.ID = ReturnFromBuy.Seller 
		left join cmn_Persons Person on Person.ID = ReturnFromBuy.Seller 
		left join cmn_Person_CustomerInfos CustomerInfo on CustomerInfo.Person = Person.ID 
		left join cmn_CustomerCategories MainGroup on MainGroup.ID = CustomerInfo.MainGroup 
		left join cmn_CustomerCategories SubGroup1 on SubGroup1.ID = CustomerInfo.SubGroup1 
		left join cmn_CustomerCategories SubGroup2 on SubGroup2.ID = CustomerInfo.SubGroup2 
		left join cmn_Cities City on City.ID = Person.City 
		left join cmn_States State on State.ID = Person.State 
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = ReturnFromBuy.CreatorUser
		left join acc_AccDocs AccDoc on AccDoc.ID = ReturnFromBuy.AccDoc 
		left join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind 
		left join ps_ReturnFromBuyItems ReturnFromBuyItem on ReturnFromBuyItem.ReturnFromBuy = ReturnFromBuy.ID 
		left join cmn_Stuffs Stuff on Stuff.ID = ReturnFromBuyItem.Stuff 
		left join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef 
		left join cmn_StuffSubCategories StuffSubCategory on StuffSubCategory.ID = StuffDef.SubCategory
		left join cmn_StuffMainCategories StuffMainCategory on StuffMainCategory.ID = StuffSubCategory.MainCategory
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReturnFromBuy.FinancialDocType
go

afw.BeforeAlterView 'ps_SeasonalPurchaseAndSalesView'
go
alter view ps_SeasonalPurchaseAndSalesView as
	select PersonID,
		PersonName,
		PhoneNumbers,
		InvoiceType,
		case InvoiceType
			when 'Sale' then N'فروش' 
			when 'Buy' then N'خرید'
			when 'ReturnFromSale' then N'برگشت از فروش'
			when 'ReturnFromBuy' then N'برگشت از خرید'
		end InvoiceType_PersianText,
		sum(TotalStuffAndServicesPrice) TotalStuffAndServicesPrice,
		sum(TotalTaxAndToll) TotalTaxAndToll,
		sum(TotalDiscount + GeneralDiscount) Discount,
		sum(StuffAndServicesTotalAmountAfterDiscount) StuffAndServicesTotalAmountAfterDiscount,
		sum(FinalAmount) FinalAmount,
		FinancialDocTypeID,
		FinancialDocType_Text,
		FinancialYear,
		Season,
		case Season
			when 'Spring' then N'بهار'
			when 'Summer' then N'تابستان'
			when 'Fall' then N'پاییز'
			when 'Winter' then N'زمستان'
		end Season_Text	,
		OrganizationUnitID,
		OrganizationUnitName	
	from (
		select Person.ID PersonID,
			Person.FullName PersonName,
			isnull(N' تلفن : '+ isnull(Person.TelNumber1, isnull(Person.WorkPhoneNumber, Person.MobilePhoneNumber1)) , '') PhoneNumbers,
			'Sale' InvoiceType,
			TotalStuffAndServicesPrice,
			TotalDiscount,
			GeneralDiscount,
			StuffAndServicesTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			IssueDate,
			SalesInvoice.FinancialYear,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,		
			case when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+ '/01/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/03/31' then 'Spring'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/04/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/06/31' then 'Summer'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/07/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/09/30' then 'Fall'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/10/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/12/30' then 'Winter'
			end Season,
			SalesInvoice.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsView Person
			inner join ps_SalesInvoices SalesInvoice on Person.ID = SalesInvoice.Customer and SalesInvoice.IsProforma = 0
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = SalesInvoice.FinancialDocType
			left join cmn_FinancialYears FinancialYear on FinancialYear.ID = SalesInvoice.FinancialYear
			left join cmn_OrganizationInformations OrganizationUnit on SalesInvoice.OrganizationUnit = OrganizationUnit.ID
		union all
		select Person.ID PersonID,
			Person.FullName PersonName,
			isnull(N' تلفن : '+ isnull(Person.TelNumber1, isnull(Person.WorkPhoneNumber, Person.MobilePhoneNumber1)) , '') PhoneNumbers,
			'Buy' InvoiceType,
			TotalStuffAndServicesPrice,
			TotalDiscount,
			GeneralDiscount,
			StuffAndServicesTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			IssueDate,
			BuyInvoice.FinancialYear,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,		
			case when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+ '/01/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/03/31' then 'Spring'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/04/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/06/31' then 'Summer'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/07/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/09/30' then 'Fall'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/10/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/12/30' then 'Winter'
			end Season,
			BuyInvoice.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsView Person
			inner join ps_BuyInvoices BuyInvoice on Person.ID = BuyInvoice.Seller
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = BuyInvoice.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on BuyInvoice.OrganizationUnit = OrganizationUnit.ID
		union all
		select Person.ID PersonID,
			Person.FullName PersonName,
			isnull(N' تلفن : '+ isnull(Person.TelNumber1, isnull(Person.WorkPhoneNumber, Person.MobilePhoneNumber1)) , '') PhoneNumbers,
			'ReturnFromBuy' InvoiceType,
			TotalPrice,
			TotalDiscount,
			GeneralDiscount,
			StuffTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			IssueDate,
			ReturnFromBuy.FinancialYear,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,		
			case when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+ '/01/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/03/31' then 'Spring'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/04/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/06/31' then 'Summer'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/07/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/09/30' then 'Fall'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/10/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/12/30' then 'Winter'
			end Season,
			ReturnFromBuy.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsView Person
			inner join ps_ReturnFromBuys ReturnFromBuy on Person.ID = ReturnFromBuy.Seller
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReturnFromBuy.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on ReturnFromBuy.OrganizationUnit = OrganizationUnit.ID
		union all
		select Person.ID PersonID,
			Person.FullName PersonName,
			isnull(N' تلفن : '+ isnull(Person.TelNumber1, isnull(Person.WorkPhoneNumber, Person.MobilePhoneNumber1)) , '') PhoneNumbers,
			'ReturnFromSale' InvoiceType,
			TotalPrice,
			TotalDiscount,
			GeneralDiscount,
			StuffTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			IssueDate,
			ReturnFromSale.FinancialYear,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,		
			case when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+ '/01/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/03/31' then 'Spring'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/04/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/06/31' then 'Summer'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/07/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/09/30' then 'Fall'
				when afw.GregorianToPersian(IssueDate) >= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5)+'/10/01' 
					and afw.GregorianToPersian(IssueDate) <= '' + substring(cast(afw.GregorianToPersian(IssueDate) as nvarchar), 0, 5) + '/12/30' then 'Winter'
			end Season,
			ReturnFromSale.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsView Person
			inner join ps_ReturnFromSales ReturnFromSale on Person.ID = ReturnFromSale.Customer
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReturnFromSale.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on ReturnFromSale.OrganizationUnit = OrganizationUnit.ID
		) SubQuery
	group by PersonID,
		PersonName,
		PhoneNumbers,
		InvoiceType,
		FinancialDocTypeID,
		FinancialDocType_Text,
		FinancialYear,
		Season,
		OrganizationUnitID,
		OrganizationUnitName
go

afw.BeforeAlterView 'ps_InvoicesReportView'
go
alter view ps_InvoicesReportView as
	select PersonID,
	InvoiceID,
	InvoiceNumber,
	PersonName,
	TotalStuffAndServicesPrice,
	GeneralDiscount,
	StuffAndServicesTotalAmountAfterDiscount,
	TotalTaxAndToll,
	FinalAmount,
	FinancialYear,
	FinancialGroup,
	IssueDate,
	cast(afw.GregorianToPersian(IssueDate)as nvarchar) IssueDate_PersionDate,
	InvoiceType,
	InvoiceType_PersianText,
	FinancialDocTypeID,
	FinancialDocType_Text,
	FinancialGroup_Text,
	sum(TotalDiscount + GeneralDiscount) Discount,
		OrganizationUnitID,
		OrganizationUnitName
	from (
		select Person.ID PersonID,
			SalesInvoice.ID InvoiceID,
			SalesInvoice.InvoiceNumber,
			Person.FullName PersonName,
			TotalStuffAndServicesPrice,
			GeneralDiscount,
			TotalDiscount,
			StuffAndServicesTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			SalesInvoice.FinancialYear,
			SalesInvoice.FinancialGroup,
			IssueDate,
			cast(afw.GregorianToPersian(IssueDate)as nvarchar) IssueDate_PersionDate,
			'Sale' InvoiceType,
			N'فاکتور فروش' InvoiceType_PersianText,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,
			FinancialGroup.Title FinancialGroup_Text,
			SalesInvoice.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsLookUpView Person
			inner join ps_SalesInvoices SalesInvoice on Person.ID = SalesInvoice.Customer and SalesInvoice.IsProforma = 0
			left join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = SalesInvoice.FinancialGroup
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = FinancialGroup.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on SalesInvoice.OrganizationUnit = OrganizationUnit.ID
		union
		select Person.ID PersonID,
			BuyInvoice.ID InvoiceID,
			BuyInvoice.InvoiceNumber,
			Person.FullName PersonName,
			TotalStuffAndServicesPrice,
			GeneralDiscount,
			TotalDiscount,
			StuffAndServicesTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			BuyInvoice.FinancialYear,
			BuyInvoice.FinancialGroup,
			IssueDate,
			cast(afw.GregorianToPersian(IssueDate)as nvarchar) IssueDate_PersionDate,
			'Buy' InvoiceType,
			N'فاکتور خرید' InvoiceType_PersianText,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,
			FinancialGroup.Title FinancialGroup_Text,
			BuyInvoice.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsLookUpView Person
			inner join ps_BuyInvoices BuyInvoice on Person.ID = BuyInvoice.Seller
			left join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = BuyInvoice.FinancialGroup
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = FinancialGroup.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on BuyInvoice.OrganizationUnit = OrganizationUnit.ID
	union
		select Person.ID PersonID,
			ReturnFromSale.ID InvoiceID,
			ReturnFromSale.ReturnFromSalesNumber,
			Person.FullName PersonName,
			TotalPrice,
			GeneralDiscount,
			TotalDiscount,
			StuffTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			ReturnFromSale.FinancialYear,
			ReturnFromSale.FinancialGroup,
			IssueDate,
			cast(afw.GregorianToPersian(IssueDate)as nvarchar) IssueDate_PersionDate,
			'ReturnFromSale' InvoiceType,
			N'فاکتور برگشت از فروش' InvoiceType_PersianText,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,
			FinancialGroup.Title FinancialGroup_Text,
			ReturnFromSale.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsLookUpView Person
			inner join ps_ReturnFromSales ReturnFromSale on Person.ID = ReturnFromSale.Customer
			left join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = ReturnFromSale.FinancialGroup
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = FinancialGroup.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on ReturnFromSale.OrganizationUnit = OrganizationUnit.ID
	union
		select Person.ID PersonID,
			ReturnFromBuy.ID InvoiceID,
			ReturnFromBuy.ReturnFromBuyNumber,
			Person.FullName PersonName,
			TotalPrice,
			GeneralDiscount,
			TotalDiscount,
			StuffTotalAmountAfterDiscount,
			TotalTaxAndToll,
			FinalAmount,
			ReturnFromBuy.FinancialYear,
			ReturnFromBuy.FinancialGroup,
			IssueDate,
			cast(afw.GregorianToPersian(IssueDate)as nvarchar) IssueDate_PersionDate,
			'ReturnFromBuy' InvoiceType,
			N'فاکتور برگشت از خرید' InvoiceType_PersianText,
			FinancialDocType.ID FinancialDocTypeID,
			FinancialDocType.Title FinancialDocType_Text,
			FinancialGroup.Title FinancialGroup_Text,
			ReturnFromBuy.OrganizationUnit OrganizationUnitID,
			OrganizationUnit.Name OrganizationUnitName
		from  cmn_PersonsLookUpView Person
			inner join ps_ReturnFromBuys ReturnFromBuy on Person.ID = ReturnFromBuy.Seller
			left join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = ReturnFromBuy.FinancialGroup
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = FinancialGroup.FinancialDocType
			left join cmn_OrganizationInformations OrganizationUnit on ReturnFromBuy.OrganizationUnit = OrganizationUnit.ID
	) SubQuery
	group by PersonID,
		InvoiceID,
		InvoiceNumber,
		PersonName,
		TotalStuffAndServicesPrice,
		GeneralDiscount,
		StuffAndServicesTotalAmountAfterDiscount,
		TotalTaxAndToll,
		FinalAmount,
		FinancialYear,
		FinancialGroup,
		IssueDate,
		IssueDate_PersionDate,
		InvoiceType,
		InvoiceType_PersianText,
		FinancialDocTypeID,
		FinancialDocType_Text,
		FinancialGroup_Text,
		OrganizationUnitID,
		OrganizationUnitName
go

afw.BeforeAlterView 'ps_MegaModavemSalesDashboard_InventoryView'
go
alter view ps_MegaModavemSalesDashboard_InventoryView as
	select StuffDef.Custom_CodeAnbar, 
		StuffDef.Brand, 
		StuffDef.Name,
		StuffDef.Custom_TavanKva,
		isnull(
			(select sum(case when WarehouseDocType.Name = 'Ghabz' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end)
			from wm_GhabzOrHavaleItems GhabzOrHavaleItem
				inner join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
				inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
				inner join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
				inner join cmn_StuffLocations StuffLocation on GhabzOrHavale.StuffLocation = StuffLocation.ID
				inner join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
			where GhabzOrHavaleItem.Stuff = Stuff.ID
				and StuffLocation.Code = 1--انبار توزیع
				and StuffStatus.Title = N'دست 1 آکبند'
			), 0) MojodieAkbandeAnbareTozie,
		isnull(
			(select sum(case when WarehouseDocType.Name = 'Ghabz' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end)
			from wm_GhabzOrHavaleItems GhabzOrHavaleItem
				inner join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
				inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
				inner join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
				inner join cmn_StuffLocations StuffLocation on GhabzOrHavale.StuffLocation = StuffLocation.ID
				inner join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
			where GhabzOrHavaleItem.Stuff = Stuff.ID
				and StuffLocation.Code = 2--انبار دپو
				and StuffStatus.Title = N'دست 1 آکبند'
			), 0) MojodieAkbandeAnbareDepo,
		isnull(
			(select sum(case when WarehouseDocType.Name = 'Ghabz' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end)
			from wm_GhabzOrHavaleItems GhabzOrHavaleItem
				inner join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
				inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
				inner join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
				inner join cmn_StuffLocations StuffLocation on GhabzOrHavale.StuffLocation = StuffLocation.ID
				inner join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
			where GhabzOrHavaleItem.Stuff = Stuff.ID
				and StuffLocation.Code = 1--انبار توزیع
				and StuffStatus.Title = N'دست 2 سالم'
			), 0) MojodieDasteDoeAnbareTozie,
		isnull(
			(select sum(case when WarehouseDocType.Name = 'Ghabz' then GhabzOrHavaleItem.Quantity else GhabzOrHavaleItem.Quantity * -1 end)
			from wm_GhabzOrHavaleItems GhabzOrHavaleItem
				inner join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale
				inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
				inner join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
				inner join cmn_StuffLocations StuffLocation on GhabzOrHavale.StuffLocation = StuffLocation.ID
				inner join wm_StuffStatuss StuffStatus on StuffStatus.ID = GhabzOrHavaleItem.StuffStatus
			where GhabzOrHavaleItem.Stuff = Stuff.ID
				and StuffLocation.Code = 2--انبار دپو
				and StuffStatus.Title = N'دست 2 سالم'
			), 0) MojodieDasteDoeAnbareDepo,
		isnull(
			(select isnull(sum(Q.Quantity), 0)
			from (
				select case when ReserveOrUnreserve.Name = 'Reserve' then ReserveListItem.Quantity
					- (
						select isnull(sum(Quantity) , 0)
						from wm_WarehouseInventoryReserveListItems
						where Unreserve_RelatedReserveItem = ReserveListItem.ID
						)
					else 0 end Quantity
				from wm_WarehouseInventoryReserveListItems ReserveListItem
					left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = ReserveListItem.InsertOrganizationUnit
					left join afw_OptionSetItems ReserveOrUnreserve on ReserveOrUnreserve.ID = ReserveListItem.ReserveOrUnreserve	
				where ReserveListItem.Stuff = Stuff.ID and 
					OrganizationUnit.LatinName = 'Anbardari' and
					Unreserve_RelatedReserveItem is null
					) Q
		),0) ReserveAnbardari,
		isnull(
			(select isnull(sum(Q.Quantity), 0)
			from (
				select case when ReserveOrUnreserve.Name = 'Reserve' then ReserveListItem.Quantity
					- (
						select isnull(sum(Quantity) , 0)
						from wm_WarehouseInventoryReserveListItems
						where Unreserve_RelatedReserveItem = ReserveListItem.ID
						)
					else 0 end Quantity
				from wm_WarehouseInventoryReserveListItems ReserveListItem
					left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = ReserveListItem.InsertOrganizationUnit
					left join afw_OptionSetItems ReserveOrUnreserve on ReserveOrUnreserve.ID = ReserveListItem.ReserveOrUnreserve	
				where ReserveListItem.Stuff = Stuff.ID and 
					OrganizationUnit.LatinName = 'Sales' and
					Unreserve_RelatedReserveItem is null
					) Q
		),0)ReserveForoosh,
		isnull(
			(select isnull(sum(Q.Quantity), 0)
			from (
				select case when ReserveOrUnreserve.Name = 'Reserve' then ReserveListItem.Quantity
					- (
						select isnull(sum(Quantity) , 0)
						from wm_WarehouseInventoryReserveListItems
						where Unreserve_RelatedReserveItem = ReserveListItem.ID
						)
					else 0 end Quantity
				from wm_WarehouseInventoryReserveListItems ReserveListItem
					left join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = ReserveListItem.InsertOrganizationUnit
					left join afw_OptionSetItems ReserveOrUnreserve on ReserveOrUnreserve.ID = ReserveListItem.ReserveOrUnreserve	
				where ReserveListItem.Stuff = Stuff.ID and 
					OrganizationUnit.LatinName = 'Service' and
					Unreserve_RelatedReserveItem is null
					) Q
		),0)ReserveKhadamat,
		(	
			select isnull(sum(Q.Quantity), 0)
			from (
				select isnull(InitialOnTheWayQuantity - (
						select isnull(sum(CurrentPartyReceivedQuantity) , 0)
						from wm_OnTheWayStuffReceiveInfos
						where OnTheWayStuffInfo = OnTheWayStuffInfo.ID
						) , 0) Quantity
			from wm_OnTheWayStuffInfos OnTheWayStuffInfo
			where Stuff = Stuff.ID) q
		) DarRah,
		isnull(NearestOnTheWay.Quantity , 0) NearestOnTheWayQuantity,
		isnull(NearestOnTheWay.DaysLeft, 0) NearestOnTheWayDaysLeft,		
		(
			select isnull(sum(SalesInvoiceItem.Quantity), 0) 
			from ps_SalesInvoiceItems SalesInvoiceItem
				left join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = SalesInvoiceItem.SalesInvoice
				left join cmn_WorkflowStages WorkFlowStage on WorkFlowStage.ID = SalesInvoice.WorkflowStage
			where SalesInvoice.IsProforma = 1 and
				WorkFlowStage.LatinName = 'ApprovedByCustomer' and
				SalesInvoiceItem.Stuff = Stuff.ID
		) ApprovedByCustomerQuantity,(
			select isnull(sum(SalesInvoiceItem.Quantity), 0) 
			from ps_SalesInvoiceItems SalesInvoiceItem
				left join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = SalesInvoiceItem.SalesInvoice
				left join cmn_WorkflowStages WorkFlowStage on WorkFlowStage.ID = SalesInvoice.WorkflowStage
				left join afw_OptionSetItems HavaleIssuingStatus on HavaleIssuingStatus.ID = SalesInvoice.HavaleIssuingStatus
			where SalesInvoice.IsProforma = 1 and
				HavaleIssuingStatus.Name = 'HavaleNashodeh' and 
				WorkFlowStage.LatinName = 'FinalApproved' and
				SalesInvoiceItem.Stuff = Stuff.ID
		) FinalApprovedQuantity,
		isnull(
			(select PriceListStuffItem.UnitPrice
			from ps_PriceListStuffItems PriceListStuffItem
				left join ps_PriceLists PriceList on PriceList.ID = PriceListStuffItem.PriceList
			where PriceListStuffItem.StuffDef = StuffDef.ID
				and PriceList.Title = N'قیمت 1'			
			), 0) Price,
		wm.GetStuffRealStock(Stuff.ID, '339F1134-0DC9-456F-9B61-F9BD9CCEF5CF', null, null, null, null) MojodiAnbareKhadamat,
		wm.GetStuffRealStock(Stuff.ID, '9763CC52-E0CB-43BD-8A94-ED8E37D9594E', null, null, null, null) AnbareTamirgah
	from cmn_StuffDefs StuffDef
		left join cmn_Stuffs Stuff on Stuff.StuffDef = StuffDef.ID
		outer apply (
			select top 1 Quantity, DaysLeft
			from (
				select isnull(InitialOnTheWayQuantity - 
					(
						select isnull(sum(CurrentPartyReceivedQuantity) , 0)
						from wm_OnTheWayStuffReceiveInfos 
						where OnTheWayStuffInfo = OnTheWayStuffInfo.ID
					) , 0) Quantity,
				datediff(day, GetDate(), ExpectedReceiveDate) DaysLeft				
				from wm_OnTheWayStuffInfos OnTheWayStuffInfo
				where Stuff = Stuff.ID
				) Q1
			where Quantity > 0
			order by DaysLeft
		) NearestOnTheWay
	where Custom_CodeAnbar not like 'C%' and 
		Custom_CodeAnbar not in ('0', '')
--	order by Custom_CodeAnbar