--Indexes:
if not exists (select 1 from sys.indexes where name = 'IX_cmn_PersonRoleRelations_PersonAndPersonRole')
	create index IX_cmn_PersonRoleRelations_PersonAndPersonRole on cmn_PersonRoleRelations(Person, PersonRole)
go

if not exists (select 1 from sys.indexes where name = 'IX_cmn_PhoneNumbers_Person')
	create index IX_cmn_PhoneNumbers_Person on cmn_PhoneNumbers(Person)
go

--Constraints:
if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_CompetitorInfos_Person'))
	alter table cmn_Person_CompetitorInfos with nocheck
	add constraint UC_cmn_Person_CompetitorInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_ConnectedPersonInfos_Person'))
	alter table cmn_Person_ConnectedPersonInfos with nocheck
	add constraint UC_cmn_Person_ConnectedPersonInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_CustomerInfos_Person'))
	alter table cmn_Person_CustomerInfos with nocheck
	add constraint UC_cmn_Person_CustomerInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_DriverInfos_Person'))
	alter table cmn_Person_DriverInfos with nocheck
	add constraint UC_cmn_Person_DriverInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_EmployeeInfos_Person'))
	alter table cmn_Person_EmployeeInfos with nocheck
	add constraint UC_cmn_Person_EmployeeInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_MarketerInfos_Person'))
	alter table cmn_Person_MarketerInfos with nocheck
	add constraint UC_cmn_Person_MarketerInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_MiscInfos_Person'))
	alter table cmn_Person_MiscInfos with nocheck
	add constraint UC_cmn_Person_MiscInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_PotentialCustomerInfos_Person'))
	alter table cmn_Person_PotentialCustomerInfos with nocheck
	add constraint UC_cmn_Person_PotentialCustomerInfos_Person unique (Person) 
go

if (not exists (select 1 from sys.key_constraints where name = 'UC_cmn_Person_SupplierInfos_Person'))
	alter table cmn_Person_SupplierInfos with nocheck
	add constraint UC_cmn_Person_SupplierInfos_Person unique (Person) 
go


afw.BeforeAlterView 'cmn_PersonsLookUpView'
go
alter view cmn_PersonsLookUpView as
	select Person.ID, 
	case when PersonType.Name = 'Haghighi' then 
			isnull(Gender.Title + ' ', '') + isnull(Person.Name + ' ', '') + isnull(Person.LastName, N'')
		else 
			case when rtrim(Person.Name) not like N'شرکت%' then N'شرکت ' else '' end 
			+ isnull(Person.Name, '') 
	end as FullName
	from dbo.cmn_Persons AS Person 
		left join dbo.afw_OptionSetItems as Gender on Gender.ID = Person.Gender 
		inner join dbo.afw_OptionSetItems as PersonType on Person.PersonType = PersonType.ID
go

afw.BeforeAlterView 'cmn_PersonsView'
go
alter view cmn_PersonsView as 
	select Person.ID,
		Person.CreatorUser,
		Person.CreationTime,
		afw.GregorianToPersian(Person.CreationTime) as CreationTime_Persian,
		Person.LastModifierUser,
		Person.LastModifyTime,
		Person.PersonType, 
		Person.Gender,
		Person.LastName,
		Person.BirthDate,
		Person.CodeMelli,
		Person.CodeEghtesadi,
		Person.PostalCode, 
        Person.Email,
        Person.AccountNumber,
        Person.BankCardNumber,
        Person.State,
        Person.City,
        Person.Name,
        Person.Shahrestan,
        Person.Area,
        Person.Address1, 
        Person.TelNumber1,
        Person.MobilePhoneNumber1,
		Person.WorkPhoneNumber,
        Person.Fax,
        Person.ShomareSabt,
        Person.RecognitionMethod,
        Person.OwnerUser,
        Person.ExportedRecordID, 
		PersonLookUpView.FullName, 
        PersonType.Title as PersonType_Text,
        State.Name as State_Text,
        City.Name as City_Text,
        Shahrestan.Name as Shahestan_Text,
        Region.Name as Area_Text, 
        RecognitionMethod.Title as RecognitionMethod_Text,
		Person.NationalID
	from dbo.cmn_Persons as Person 
		inner join dbo.afw_OptionSetItems as PersonType on Person.PersonType = PersonType.ID	
		left join cmn_PersonsLookUpView PersonLookUpView on PersonLookUpView.ID = Person.ID
		left join dbo.cmn_States as State on Person.State = State.ID 
		left join dbo.cmn_Cities as City on Person.City = City.ID 
		left join dbo.cmn_Shahrestans as Shahrestan on Person.Shahrestan = Shahrestan.ID 
		left join dbo.cmn_Regions as Region on Person.Region = Region.ID 
		left join dbo.crm_RecognitionMethods as RecognitionMethod on Person.RecognitionMethod = RecognitionMethod.ID 
		left join dbo.afw_OptionSetItems as Gender on Gender.ID = Person.Gender 
go

--اضافه شدن نام شرکت های مرتبط در پرانتز پیاده سازی نشده.
--exec afw.BeforeAlterProc 'cmn.UpdatePersonsStoredDisplayText'
--go
--alter proc cmn.UpdatePersonsStoredDisplayText as
--begin
--	declare @Haghighi uniqueidentifier
--	set @Haghighi = 'B8E5C2D4-2D14-4004-8102-60D4B587DE23'

--	update cmn_Persons
--	set StoredDisplayText = ltrim(rtrim(isnull(Name, '')))

--	update cmn_Persons
--	set StoredDisplayText = StoredDisplayText + 
--		case when StoredDisplayText <> '' and ltrim(rtrim(isnull(LastName, ''))) <> '' then ' ' else '' end +
--		ltrim(rtrim(isnull(LastName, '')))
--	where PersonType = @Haghighi

--	update cmn_Persons
--	set StoredDisplayText = StoredDisplayText + 
--		case when StoredDisplayText <> '' and ltrim(rtrim(isnull(NameTag, ''))) <> '' then ' ' else '' end +
--		case when ltrim(rtrim(isnull(NameTag, ''))) <> '' then '(' + ltrim(rtrim(NameTag)) + ')' else '' end

--	update cmn_Persons
--	set StoredDisplayText = StoredDisplayText + 
--		case when StoredDisplayText <> '' and ltrim(rtrim(isnull(MobilePhoneNumber1, ''))) <> '' then ' | ' else '' end +
--		ltrim(rtrim(isnull(MobilePhoneNumber1, '')))
--	where PersonType = @Haghighi
--end
--go

afw.BeforeAlterView 'cmn_ActivitiesView'
go
alter view cmn_ActivitiesView as 
	select Activity.ID, 
		Activity.Title,
		Activity.ReminderTime,
		ActivityType.Name ActivityType_Name,
		ActivityType.Title ActivityType_Title,
		Activity.CreatorUser,
		Activity.OwnerUser,
		OwnerUser.DisplayName OwnerUser_Text,
		Activity.Priority,
		Activity.ActivityStatus,
		Activity.SalesCase SalesCaseID,
		SalesCase.Title SalesCase_Title,
		SalesCaseCustomer.FullName SalesCaseCustomer_Text
	from cmn_FilteredActivities Activity
		inner join afw_OptionSetItems ActivityType on ActivityType.ID = Activity.ActivityType
		inner join afw_SystemUsersView OwnerUser on OwnerUser.ID = Activity.OwnerUser
		left join crm_SalesCases SalesCase on SalesCase.ID = Activity.SalesCase
		left join cmn_PersonsView SalesCaseCustomer on SalesCaseCustomer.ID = SalesCase.Customer
go

afw.BeforeAlterProc 'cmn.SyncEmailIdsWithDatabaseAndGetNewIds'
go
alter proc [cmn].SyncEmailIdsWithDatabaseAndGetNewIds @Ids nvarchar(max),
	@EmailAccountInfo uniqueidentifier AS
BEGIN
	declare  @query  nvarchar(Max) =''
	create table #ServerIds (ID int)
	create table #DeleteIds	(ID int)
	--------------------------------------------------------------------split string -----------------------------

	Declare @individual varchar(20) = null

	WHILE LEN(@Ids) > 0
	BEGIN
		IF PATINDEX('%,%',@Ids) > 0
		BEGIN
			SET @individual = SUBSTRING(@Ids, 0, PATINDEX('%,%',@Ids))     
			insert into #ServerIds  values (@individual) 
			SET @Ids = SUBSTRING(@Ids, LEN(@individual + ',') + 1, LEN(@Ids))
		END
		ELSE
		BEGIN
			SET @individual = @Ids
			SET @Ids = NULL
			insert into #ServerIds  values (@individual) 
		END
	END

	----------------------------------------------------------------------------------------------------------------
	insert into #DeleteIds
	select em.EmailIdInMailServer 
	from cmn_Emails em  
	where  em.EmailIdInMailServer not in (select * from #ServerIds) 
		and em.EmailAccountInfo = @EmailAccountInfo

	select sid.ID 
	from #ServerIds as sid
	where sid.ID not in (select em.EmailIdInMailServer from cmn_Emails em where em.EmailAccountInfo=@EmailAccountInfo)

	delete from cmn_SentMailReceivers
	where Email in (
		select ID  from cmn_Emails   where EmailIdInMailServer in (  select * from #DeleteIds))

	delete from cmn_Emails where EmailIdInMailServer in (select * from #DeleteIds)

	drop table #ServerIds
	drop table #DeleteIds
END
go

afw.BeforeAlterProc 'cmn.StuffBarCodePrint'
go
alter proc cmn.StuffBarCodePrint 
	@FromStuffCode bigint,
	@ToStuffCode bigint,
	@PrintCount int 
as 
set fmtonly off
begin 
	set nocount on; 
	IF  exists (select * from sys.objects where name = '#TempStuffBarCode')
		drop table #TempStuffBarCode
	
	create table #TempStuffBarCode(ID int identity(1,1) not null, StuffDefID uniqueidentifier, Code nvarchar(50), Name nvarchar(100),
		BarCode nvarchar(50), MainCategoryTitle nvarchar(100), SubCategoryTitle nvarchar(100), Custom_Esteghrar nvarchar(50))
 
	declare @i int
	set @i = 0
 
	while(@i < @PrintCount)
	begin  
		set @i = @i + 1  
 
		insert into #TempStuffBarCode (StuffDefID, Code, Name, BarCode, MainCategoryTitle, SubCategoryTitle, Custom_Esteghrar)

		select StuffDef.ID, cast(StuffDef.Code as bigint) Code, StuffDef.Name, StuffDef.BarCode,
			MainCategory.Title MainCategoryTitle, SubCategory.Title SubCategoryTitle, Custom_Esteghrar
		from cmn_StuffDefs StuffDef
			inner join cmn_StuffSubCategories SubCategory on SubCategory.ID = StuffDef.SubCategory
			inner join cmn_StuffMainCategories MainCategory on MainCategory.ID = SubCategory.MainCategory
		where cast(StuffDef.Code as bigint) >= @FromStuffCode and cast(StuffDef.Code as bigint) <= @ToStuffCode
			and StuffDef.BarCode is not null and isnumeric(StuffDef.Code) = 1
		order by cast(StuffDef.Code as bigint) 
	end

	select Temp.*, Organ.Name OrganName, Organ.PhoneNumber
	from #TempStuffBarCode Temp
		cross join cmn_OrganizationInformations Organ
		order by cast(Code as bigint)
end 
go


afw.BeforeAlterProc 'cmn.InvoicesStuffBarCodePrint'
go
alter proc cmn.InvoicesStuffBarCodePrint 
	@InvoiceID uniqueidentifier,
	@InvoiceType nvarchar(20)
as 
set fmtonly off
begin 
	set nocount on; 

	if  exists (select * from sys.objects where name = '#TempInvoicesStuffCount')
		drop table #TempInvoicesStuffCount
	if  exists (select * from sys.objects where name = '#TempStuffBarCode')
		drop table #TempStuffBarCode

	create table #TempInvoicesStuffCount(ID int identity(1,1) not null, StuffDefID uniqueidentifier, Quantity bigint,  )
  
	create table #TempStuffBarCode(ID int identity(1,1) not null, StuffDefID uniqueidentifier, Code nvarchar(50), Name nvarchar(100),
		BarCode nvarchar(50), MainCategoryTitle nvarchar(100), SubCategoryTitle nvarchar(100), Custom_Esteghrar nvarchar(50))

	if @InvoiceType = 'SalesInvoice'
	begin
		insert into #TempInvoicesStuffCount (StuffDefID, Quantity)

		select StuffDef.ID StuffDefID, SalesInvoiceItem.Quantity
		from cmn_StuffDefs StuffDef 
			inner join cmn_Stuffs Stuf on Stuf.StuffDef = StuffDef.ID
			inner join ps_SalesInvoiceItems SalesInvoiceItem on SalesInvoiceItem.Stuff = Stuf.ID
			inner join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = SalesInvoiceItem.SalesInvoice
		where SalesInvoice.ID = @InvoiceID
	end

	if @InvoiceType = 'BuyInvoice'
	begin
		insert into #TempInvoicesStuffCount (StuffDefID, Quantity)

		select StuffDef.ID StuffDefID, BuyInvoiceItem.Quantity
		from cmn_StuffDefs StuffDef 
			inner join cmn_Stuffs Stuf on Stuf.StuffDef = StuffDef.ID
			inner join ps_BuyInvoiceItems BuyInvoiceItem on BuyInvoiceItem.Stuff = Stuf.ID
			inner join ps_BuyInvoices BuyInvoice on BuyInvoice.ID = BuyInvoiceItem.BuyInvoice
		where BuyInvoice.ID = @InvoiceID
	end
	 
	declare @invoicesStuffCount int
	declare @s int
	declare @i int

	declare @StuffDefID uniqueidentifier
	declare @Quantity bigint

	set @s = 1 
	select @invoicesStuffCount = count(*) from #TempInvoicesStuffCount
	 
	while (@s <= @invoicesStuffCount)
	begin
		select @StuffDefID = StuffDefID, @Quantity = Quantity  from #TempInvoicesStuffCount where ID = @s
		set @i = 0
		while(@i < @Quantity)
		begin  
			set @i = @i + 1  
 
			insert into #TempStuffBarCode (StuffDefID, Code, Name, BarCode, MainCategoryTitle, SubCategoryTitle, Custom_Esteghrar)

			select StuffDef.ID, cast(StuffDef.Code as bigint) Code, StuffDef.Name, StuffDef.BarCode,
				MainCategory.Title MainCategoryTitle, SubCategory.Title SubCategoryTitle, Custom_Esteghrar
			from cmn_StuffDefs StuffDef
				inner join cmn_StuffSubCategories SubCategory on SubCategory.ID = StuffDef.SubCategory
				inner join cmn_StuffMainCategories MainCategory on MainCategory.ID = SubCategory.MainCategory 
			where StuffDef.ID = @StuffDefID
				and StuffDef.BarCode is not null
			order by cast(StuffDef.Code as bigint) 
		end
		set @s = @s + 1
	end

	select Temp.*, Organ.Name OrganName, Organ.PhoneNumber
	from #TempStuffBarCode Temp
		cross join cmn_OrganizationInformations Organ
		order by cast(Code as bigint)
end
go

go
declare @count int
select @count = count(*) from cmn_StuffLabels where LabelNo is null 
 
declare @i int
declare @id uniqueidentifier
set @i = 0;

while @i < @count
begin 
	set @i = @i + 1 
	select top 1 @id = ID from cmn_StuffLabels where LabelNo is null order by Name
	update cmn_StuffLabels set LabelNo = @i where ID = @id
end
go

afw.BeforeAlterSF
go
alter function cmn.GetGregorianDatePersionDayName (@DateTime DateTime) 
returns nvarchar(20) 
as
begin

declare @PersionDayName nvarchar(20)

if @DateTime is null 
	return ''

if datename(dw, @DateTime) = 'Saturday'
	set @PersionDayName = N'شنبه'
else if datename(dw, @DateTime) = 'Sunday'
	set @PersionDayName = N'یکشنبه'
else if datename(dw, @DateTime) = 'Monday'
	set @PersionDayName = N'دوشنبه'
else if datename(dw, @DateTime) = 'Tuesday'
	set @PersionDayName = N'سه شنبه'
else if datename(dw, @DateTime) = 'Wednesday'
	set @PersionDayName = N'چهارشنبه'
else if datename(dw, @DateTime) = 'Thursday'
	set @PersionDayName = N'پنجشنبه'
else if datename(dw, @DateTime) = 'Friday'
	set @PersionDayName = N'جمعه'

return @PersionDayName

end
go

afw.BeforeAlterProc 'cmn.ExportEntityRecursive'
go
alter procedure cmn.ExportEntityRecursive
	@EntityDefID uniqueidentifier,
	@EntityID uniqueidentifier,
	@DestinationDB nvarchar(max)
as
begin 
	declare @FieldName varchar(100)
	declare @SingleEntityField_LookupEntityDefID uniqueidentifier
	declare @EntityTableName varchar(100)
	declare @InsertQuery varchar(1000)

	if cast(@EntityID as varchar(50)) = ''
		raiserror (N'Parameter @EntityID is not set.', 16, 1); 

	select @EntityTableName = EntityDef.DbTableName 
	from afw_EntityDefs EntityDef 
	where ID = '' + cast(@EntityDefID as varchar(50)) + ''

	--skip if entity exists in destination DB:
	declare @EntityExistsInDestinationDB bit
	declare @EntityExistsInDestinationDB_Table table (EntityExistsInDestinationDB bit)
	declare @EntityExistsInDestinationDB_Query varchar(1000)
	
	set @EntityExistsInDestinationDB_Query = '
		if exists (select 1 from ' + @DestinationDB + '.dbo.' + @EntityTableName + ' where ID = ''' + cast(@EntityID as varchar(50)) + ''')
			select 1
		else
			select 0'

	delete from @EntityExistsInDestinationDB_Table		
	insert into @EntityExistsInDestinationDB_Table exec (@EntityExistsInDestinationDB_Query)
	select @EntityExistsInDestinationDB = EntityExistsInDestinationDB from @EntityExistsInDestinationDB_Table 
	if @EntityExistsInDestinationDB = 1
	begin
		--print 'Exists'
		return
	end
	------------------------------------------------------------------------


	declare SingleEntityFieldsCursor cursor local for
	select EntityFieldDef.Name, FieldInfo.LookupEntityDef, LookupEntity_EntityDef.DbTableName LookupEntityTableName
	from afw_EntityFieldDefs EntityFieldDef
		inner join afw_FieldTypes FieldType on FieldType.ID = EntityFieldDef.FieldTypeID
		inner join afw_FieldInfos_SingleEntityFieldInfos FieldInfo on FieldInfo.ID = EntityFieldDef.FieldInfoID
		inner join afw_EntityDefs LookupEntity_EntityDef on LookupEntity_EntityDef.ID = FieldInfo.LookupEntityDef
	where FieldType.Name = 'SingleEntity' 
		and EntityFieldDef.EntityDefID = '' + cast(@EntityDefID as varchar(50)) + ''	
	
	declare @SingleEntityTableName varchar(100)
	declare @SingleEntityFieldValue_Query varchar(1000)
	declare @SingleEntityFieldValue_Table table (SingleEntityFieldValue varchar(50))
	declare @SingleEntityFieldValue uniqueidentifier

	open SingleEntityFieldsCursor
	fetch next from SingleEntityFieldsCursor into @FieldName, @SingleEntityField_LookupEntityDefID, @SingleEntityTableName
	while @@fetch_status = 0   
	begin 	
		set @SingleEntityFieldValue_Query = 'select ' + @FieldName + ' from ' + @EntityTableName + ' where ID = ''' + cast(@EntityID as varchar(50)) + ''''
	
		delete from @SingleEntityFieldValue_Table		
		insert into @SingleEntityFieldValue_Table exec (@SingleEntityFieldValue_Query)

		select @SingleEntityFieldValue = SingleEntityFieldValue from @SingleEntityFieldValue_Table		

		if cast(@SingleEntityFieldValue as varchar(50)) <> ''
		begin
			--declare @ExecQuery varchar(1000)
			--set @ExecQuery = 'cmn.ExportEntityRecursive ' 
			--	+ cast(@SingleEntityField_LookupEntityDefID as varchar(50)) + ', ' +
			--	+ cast(@SingleEntityFieldValue as varchar(50)) + ', ' +
			--	+ cast(@DestinationDB as varchar(50))
			
			--print @SingleEntityField_LookupEntityDefID
			--print @SingleEntityFieldValue
			--print @DestinationDB
			--print @EntityTableName
			--print @FieldName
			--print @ExecQuery			

			if cast(@SingleEntityFieldValue as varchar(50)) <> cast(@EntityID as varchar(50)) 
				exec cmn.ExportEntityRecursive @SingleEntityField_LookupEntityDefID, @SingleEntityFieldValue, @DestinationDB
		end

		fetch next from SingleEntityFieldsCursor into @FieldName, @SingleEntityField_LookupEntityDefID, @SingleEntityTableName
	end

	close SingleEntityFieldsCursor   
	deallocate SingleEntityFieldsCursor	

	--Inserting entity itself

	delete from @EntityExistsInDestinationDB_Table		
	insert into @EntityExistsInDestinationDB_Table exec (@EntityExistsInDestinationDB_Query)
	select @EntityExistsInDestinationDB = EntityExistsInDestinationDB from @EntityExistsInDestinationDB_Table 
	if @EntityExistsInDestinationDB = 1
	begin
		print 'Exists'
		return
	end

	set @InsertQuery = 'insert into ' + @DestinationDB + '.dbo.' + @EntityTableName + ' ' +
		'select * ' +
		'from ' + @EntityTableName + ' ' +
		'where ID = ''' + cast(@EntityID as varchar(50)) + ''''
	
	--print @InsertQuery	
	exec (@InsertQuery)

	--Inserting compose and aggregate entities:
	declare ComposeAndAggregateFieldsCursor cursor local for
	select EntityFieldDef.Name, FieldInfo.ChildEntityDef, ChildEntityDef.DbTableName ChildEntityDefTableName, ChildEntityRelationshipField.Name ChildEntityRelationshipFieldName
	from afw_EntityFieldDefs EntityFieldDef
		inner join afw_FieldTypes FieldType on FieldType.ID = EntityFieldDef.FieldTypeID
		inner join afw_FieldInfos_ComposeEntityListFieldInfos FieldInfo on FieldInfo.ID = EntityFieldDef.FieldInfoID
		inner join afw_EntityDefs ChildEntityDef on ChildEntityDef.ID = FieldInfo.ChildEntityDef
		inner join afw_EntityFieldDefs ChildEntityRelationshipField on ChildEntityRelationshipField.ID = FieldInfo.ChildEntityRelationshipField
	where FieldType.Name = 'ComposeEntityList' 
		and EntityFieldDef.EntityDefID = '' + cast(@EntityDefID as varchar(50)) + ''
	union
	select EntityFieldDef.Name, FieldInfo.ChildEntityDef, AssociationEntityDef.DbTableName ChildEntityDefTableName, ParentEntityRelationshipField.Name ChildEntityRelationshipFieldName
	from afw_EntityFieldDefs EntityFieldDef
		inner join afw_FieldTypes FieldType on FieldType.ID = EntityFieldDef.FieldTypeID
		inner join afw_FieldInfos_AggregateEntityListFieldInfos FieldInfo on FieldInfo.ID = EntityFieldDef.FieldInfoID
		inner join afw_EntityDefs AssociationEntityDef on AssociationEntityDef.ID = FieldInfo.AssociationEntityDef
		inner join afw_EntityFieldDefs ParentEntityRelationshipField on ParentEntityRelationshipField.ID = FieldInfo.ParentEntityRelationshipField
	where FieldType.Name = 'AggregateEntityList' 
		and EntityFieldDef.EntityDefID = '' + cast(@EntityDefID as varchar(50)) + ''

	declare @ComposeField_ChildEntityDefID uniqueidentifier
	declare @ComposeField_ChildEntityRelationshipFieldName varchar(50)
	declare @ComposeEntityTableName varchar(100)
	declare @ComposeEntities_Query varchar(1000)
	declare @ComposeEntities_Table table (ComposeEntityFieldValue varchar(50))
	declare @ComposeEntityID uniqueidentifier

	open ComposeAndAggregateFieldsCursor
	fetch next from ComposeAndAggregateFieldsCursor into @FieldName, @ComposeField_ChildEntityDefID, @ComposeEntityTableName, @ComposeField_ChildEntityRelationshipFieldName
	while @@fetch_status = 0   
	begin
		--get compose field records:
		set @ComposeEntities_Query = 
			'select ID from ' + @ComposeEntityTableName + ' ' +
			'where ' + @ComposeField_ChildEntityRelationshipFieldName + ' = ''' + cast(@EntityID as varchar(50)) + ''''
	
		delete from @ComposeEntities_Table		
		insert into @ComposeEntities_Table exec (@ComposeEntities_Query)

		declare ComposeEntityIDsCursor cursor local for
		select * from @ComposeEntities_Table

		open ComposeEntityIDsCursor
		fetch next from ComposeEntityIDsCursor into @ComposeEntityID
		while @@fetch_status = 0   
		begin
			exec cmn.ExportEntityRecursive @ComposeField_ChildEntityDefID, @ComposeEntityID, @DestinationDB

			fetch next from ComposeEntityIDsCursor into @ComposeEntityID
		end
		close ComposeEntityIDsCursor   
		deallocate ComposeEntityIDsCursor	

		fetch next from ComposeAndAggregateFieldsCursor into @FieldName, @ComposeField_ChildEntityDefID, @ComposeEntityTableName, @ComposeField_ChildEntityRelationshipFieldName
	end

	close ComposeAndAggregateFieldsCursor   
	deallocate ComposeAndAggregateFieldsCursor	
end
go

afw.BeforeAlterProc 'cmn.ExportBasicInformation'
go
alter procedure cmn.ExportBasicInformation
as
begin 
	set nocount on;

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SystemUsers
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SystemUsers Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.afw_SystemUsers)

	insert into MegaModavem_AppFrameworkDB2.dbo.acc_AccountGroups
	select * from MegaModavem_AppFrameworkDB.dbo.acc_AccountGroups Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.acc_AccountGroups)
			
	insert into MegaModavem_AppFrameworkDB2.dbo.acc_Accounts
	select * from MegaModavem_AppFrameworkDB.dbo.acc_Accounts Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_BankAccounts
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_BankAccounts Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_BankAccounts)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_BankAccountAccSettings
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_BankAccountAccSettings Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_BankAccountAccSettings)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Banks
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Banks Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_Banks)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_States
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_States
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_States)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Cities
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Cities
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_Cities)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ProjectGroups
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ProjectGroups
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_ProjectGroups)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Projects
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Projects
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_Projects)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_CostCenterGroups
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_CostCenterGroups
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_CostCenterGroups)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_CostCenters
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_CostCenters
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_CostCenters)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ForeignCurrencyGroups
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ForeignCurrencyGroups
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_ForeignCurrencyGroups)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ForeignCurrencies
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ForeignCurrencies
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_ForeignCurrencies)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroups
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonGroups
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroups)

	insert into MegaModavem_AppFrameworkDB2.dbo.crm_RecognitionMethods
	select * from MegaModavem_AppFrameworkDB.dbo.crm_RecognitionMethods
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.crm_RecognitionMethods)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Persons
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Persons
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_Persons)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_CustomerCategories
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_CustomerCategories
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_CustomerCategories)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_CompetitorInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_CompetitorInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_CompetitorInfos)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_ConnectedPersonInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_ConnectedPersonInfos 
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_ConnectedPersonInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_CustomerInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_CustomerInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_CustomerInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_DriverInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_DriverInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_DriverInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_EmployeeInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_EmployeeInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_EmployeeInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_MarketerInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_MarketerInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_MarketerInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_MiscInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_MiscInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_MiscInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_PotentialCustomerInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_PotentialCustomerInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_PotentialCustomerInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Person_SupplierInfos
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Person_SupplierInfos
	where Person not in (select Person from MegaModavem_AppFrameworkDB2.dbo.cmn_Person_SupplierInfos)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRanks
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonRanks
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRanks)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SystemUserOrganizationUnits
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SystemUserOrganizationUnits Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.afw_SystemUserOrganizationUnits)
		and exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.afw_SystemUsers 
			where ID = Sys1.SystemUser)
		and exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.cmn_OrganizationInformations 
			where ID = Sys1.OrganizationUnit)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonsOrganizationUnits
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ConnectedPersonsOrganizationUnits
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonsOrganizationUnits)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroups
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonGroups
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroups)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroupRelations
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonGroupRelations Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroupRelations)
		and not exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonGroupRelations
			where Person = Sys1.Person 
				and PersonGroup = Sys1.PersonGroup)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRoles
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonRoles
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRoles)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRoleRelations
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonRoleRelations Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRoleRelations)
		and not exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonRoleRelations
			where Person = Sys1.Person 
				and PersonRole = Sys1.PersonRole)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PhoneNumbers
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PhoneNumbers Sys1
	where ID not in (select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_PhoneNumbers)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonsOrganizationUnits
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ConnectedPersonsOrganizationUnits
	where ID not in (
		select ID 
		from MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonsOrganizationUnits)

	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonPosts
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_ConnectedPersonPosts
	where ID not in (
		select ID 
		from MegaModavem_AppFrameworkDB2.dbo.cmn_ConnectedPersonPosts)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_PersonConnectedPersons
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_PersonConnectedPersons
	where ID not in (
		select ID 
		from MegaModavem_AppFrameworkDB2.dbo.cmn_PersonConnectedPersons)

	insert into MegaModavem_AppFrameworkDB2.dbo.acc_PersonGroupAccounts
	select * from MegaModavem_AppFrameworkDB.dbo.acc_PersonGroupAccounts Sys1
	where not exists (
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.acc_PersonGroupAccounts
		where Account = Sys1.Account and PersonGroup = Sys1.PersonGroup)

	insert into MegaModavem_AppFrameworkDB2.dbo.acc_CostCenterGroupAccounts
	select * from MegaModavem_AppFrameworkDB.dbo.acc_CostCenterGroupAccounts Sys1
	where not exists (
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.acc_CostCenterGroupAccounts
		where Account = Sys1.Account 
			and CostCenterGroup = Sys1.CostCenterGroup)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.acc_ProjectGroupAccounts
	select * from MegaModavem_AppFrameworkDB.dbo.acc_ProjectGroupAccounts Sys1
	where not exists (
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.acc_ProjectGroupAccounts
		where Account = Sys1.Account 
			and ProjectGroup = Sys1.ProjectGroup)

	insert into MegaModavem_AppFrameworkDB2.dbo.acc_ForeignCurrencyGroupAccounts
	select * from MegaModavem_AppFrameworkDB.dbo.acc_ForeignCurrencyGroupAccounts Sys1
	where not exists (
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.acc_ForeignCurrencyGroupAccounts
		where Account = Sys1.Account 
			and ForeignCurrencyGroup = Sys1.ForeignCurrencyGroup)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoles
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoles
	where ID not in (
		select ID 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoles)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleEntityPermissions
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleEntityPermissions Sys1
	where not exists( 
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleEntityPermissions
		where Entity = Sys1.Entity 
			and SecurityRole = Sys1.SecurityRole)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleReportPermissions
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleReportPermissions Sys1
	where not exists(
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleReportPermissions
		where SecurityRole = Sys1.SecurityRole
			and Report = Sys1.Report)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleItemPermissions
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleItemPermissions Sys1
	where not exists(
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleItemPermissions
		where SecurityRole = Sys1.SecurityRole
			and PermissionItem = Sys1.PermissionItem)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemMenuGroupPermissions
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleSubsystemMenuGroupPermissions Sys1
	where not exists( 
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemMenuGroupPermissions
		where SecurityRole = Sys1.SecurityRole
			and SubsystemMenuGroup = Sys1.SubsystemMenuGroup)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemMenuItemPermissions
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleSubsystemMenuItemPermissions Sys1
	where not exists(
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemMenuItemPermissions
		where SecurityRole = Sys1.SecurityRole
			and SubsystemMenuItem = Sys1.SubsystemMenuItem)

	insert into MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemPermissions 
	select * from MegaModavem_AppFrameworkDB.dbo.afw_SecurityRoleSubsystemPermissions Sys1
	where not exists(
		select 1 
		from MegaModavem_AppFrameworkDB2.dbo.afw_SecurityRoleSubsystemPermissions
		where SecurityRole = Sys1.SecurityRole
			and Subsystem = Sys1.Subsystem)
	
	-----Stuff
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffLabels
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffLabels
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffLabels)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffMainCategories
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffMainCategories
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffMainCategories)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffSubCategories
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffSubCategories
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffSubCategories)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_MeasurementUnits
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_MeasurementUnits
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_MeasurementUnits)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffDefs
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffDefs
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffDefs)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_Stuffs
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_Stuffs Sys1
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_Stuffs)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffLocations
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffLocations
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffLocations)
		
	insert into MegaModavem_AppFrameworkDB2.dbo.cmn_StuffPossibleLocations
	select * from MegaModavem_AppFrameworkDB.dbo.cmn_StuffPossibleLocations Sys1
	where ID not in( select ID from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffPossibleLocations)
		and not exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffPossibleLocations
			where StuffDef = Sys1.StuffDef 
				and StuffLocation = Sys1.StuffLocation)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.ps_Configs
	select * from MegaModavem_AppFrameworkDB.dbo.ps_Configs
	where not exists (select 1 from MegaModavem_AppFrameworkDB2.dbo.ps_Configs)
	
	------rp subsystem
	insert into MegaModavem_AppFrameworkDB2.dbo.rp_Settings
	select * from MegaModavem_AppFrameworkDB.dbo.rp_Settings
	where not exists(select 1 from MegaModavem_AppFrameworkDB2.dbo.rp_Settings)
	
	insert into MegaModavem_AppFrameworkDB2.dbo.rp_CashAccSettings
	select * from MegaModavem_AppFrameworkDB.dbo.rp_CashAccSettings Sys1
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.rp_CashAccSettings)
		and not exists(
			select 1
			from MegaModavem_AppFrameworkDB2.dbo.rp_CashAccSettings
			where FinancialYear = Sys1.FinancialYear 
				and Cash = Sys1.Cash) 
			
	insert into MegaModavem_AppFrameworkDB2.dbo.rp_Cashs
	select * from MegaModavem_AppFrameworkDB.dbo.rp_Cashs Sys1
	where ID not in(select ID from MegaModavem_AppFrameworkDB2.dbo.rp_Cashs)
end   
go

afw.BeforeAlterProc 'cmn.CopyFinancialYearSettings'
go
alter procedure cmn.CopyFinancialYearSettings
	@SourceFinancialYear uniqueidentifier, @DestinationFinancialYear uniqueidentifier as
begin
	-- financial Group
	insert into cmn_FinancialGroups(ID,
      Title,
      SaleInvoiceStartNumber,
      ProformaStartNumber,
      BuyInvoiceStartNumber,
      ReceiveReceiptStartNumber,
      PayReceiptStartNumber,
      HavaleAnbarStartNumber,
      GhabzeAnbarStartNumber,
      CalculationTax,
      SaleRequestStartNumber,
      ReturnFromSalesStartNumber,
      StockTransferStartNumber,
      StuffRequestStartNumber,
      IsDefault,
      Name,
      SalesDocGenerationMethod,
      BuyDocGenerationMethod,
      FinancialDocType,
      BuyStuffLocation,
      SaleStuffLocation,
      OfficialPrintType,
      InOfficialPrintType,
      ReturnFromBuyStartNumber,
      OrganizationUnit,
      AmaniSaleInvoiceStartNumber,
      AmaniReturnFromSalesStartNumber,
      Proforma_MatneMolahezatPishFactor,
      FinancialYear,
      ShabloneSanad_HesabeBargashtAzKharid,
      ShabloneSanad_HesabeBargashtAzForoosh,
      ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh,
      ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid,
      ShabloneSanad_HesabeForoosh,
      ShabloneSanad_HesabeKharid,
      ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh,
      ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid,
      ShabloneSanad_HesabeTakhfifat_Foroosh,
      ShabloneSanad_HesabeMoshtarian,
      ShabloneSanad_HesabeTaminKonandegan,
      ShabloneSanad_HesabeTakhfifat_Kharid,
      ShabloneSanad_HesabeForoosheAmani,
      ShabloneSanad_HesabeBargashtAzForoosheAmani,
      ShabloneSanad_HesabeMoshtarianAmani
	)
	select NEWID(),
      Title,
      SaleInvoiceStartNumber,
      ProformaStartNumber,
      BuyInvoiceStartNumber,
      ReceiveReceiptStartNumber,
      PayReceiptStartNumber,
      HavaleAnbarStartNumber,
      GhabzeAnbarStartNumber,
      CalculationTax,
      SaleRequestStartNumber,
      ReturnFromSalesStartNumber,
      StockTransferStartNumber,
      StuffRequestStartNumber,
      IsDefault,
      Name,
      SalesDocGenerationMethod,
      BuyDocGenerationMethod,
      FinancialDocType,
      BuyStuffLocation,
      SaleStuffLocation,
      OfficialPrintType,
      InOfficialPrintType,
      ReturnFromBuyStartNumber,
      OrganizationUnit,
      AmaniSaleInvoiceStartNumber,
      AmaniReturnFromSalesStartNumber,
      Proforma_MatneMolahezatPishFactor,
      @DestinationFinancialYear,
      case when ShabloneSanad_HesabeBargashtAzKharid is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeBargashtAzKharid and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeBargashtAzForoosh is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeBargashtAzForoosh and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeForoosh is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeForoosh and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeKharid is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeKharid and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeTakhfifat_Foroosh is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeTakhfifat_Foroosh and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeMoshtarian is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeMoshtarian and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeTaminKonandegan is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeTaminKonandegan and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeTakhfifat_Kharid is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeTakhfifat_Kharid and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeForoosheAmani is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeForoosheAmani and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeBargashtAzForoosheAmani is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeBargashtAzForoosheAmani and
				FinancialYear = @DestinationFinancialYear) end,
      case when ShabloneSanad_HesabeMoshtarianAmani is null then null
		else (select ID from acc_Accounts 
			where SourceAccount = ShabloneSanad_HesabeMoshtarianAmani and
				FinancialYear = @DestinationFinancialYear) end
	from cmn_FinancialGroups
	where FinancialYear = @SourceFinancialYear
	
	-- cmn_Services
	insert into cmn_ServiceAccSettings(ID,
		FinancialYear,
		Account,
		Service)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = Account
			and FinancialYear = @DestinationFinancialYear),
		Service
	from cmn_ServiceAccSettings
	where FinancialYear = @SourceFinancialYear
	
	-- cmn_Discounts
	insert into cmn_DiscountAccSettings(ID,
		FinancialYear,
		CreditorAccount,
		DebtorAccount,
		Discount)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = CreditorAccount
			and FinancialYear = @DestinationFinancialYear),
		(select ID from acc_Accounts
		 where SourceAccount = DebtorAccount
			and FinancialYear = @DestinationFinancialYear),
		Discount
	from cmn_DiscountAccSettings
	where FinancialYear = @SourceFinancialYear

	-- cmn_StuffLocations
	insert into cmn_StuffLocationAccSettings(ID,
		FinancialYear,
		Account,
		StuffLocation)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = Account
			and FinancialYear = @DestinationFinancialYear),
		StuffLocation
	from cmn_StuffLocationAccSettings
	where FinancialYear = @SourceFinancialYear

end
go

afw.BeforeAlterProc 'cmn.DeleteALLFinantialYearSettings'
go

alter procedure cmn.DeleteAllFinantialYearSettings
 @FinancialYear uniqueidentifier as
begin
	--عملیات مالی خزانه
	delete from rp_FinancialOpKindAccSettings where FinancialYear = @FinancialYear	
	-- تنظیمات حساب تغییر وضعیت چک
	delete from rp_ChequeStatusChangeAccSettings where FinancialYear = @FinancialYear	
	-- تنظیمات حسابداری طرف حساب تنخواه	
	delete from rp_TarafHesabeTankhahAccSettings where FinancialYear = @FinancialYear	
	--تنظیمات حسابداری تنخواه گردان ها
	delete from rp_TankhahGardanAccSettings where FinancialYear = @FinancialYear
	--تنظیمات حسابداری صندوق ها
	delete from rp_CashAccSettings where FinancialYear = @FinancialYear
	--تعریف اعلامیه مالی
	delete from cc_DefinedFinancialDeclarations where FinancialYear = @FinancialYear
	--تنظیمات حسابداری انبار
	delete from wm_WarehouseDocsAccSettingss where FinancialYear = @FinancialYear	
	-- تخفیف
	delete from cmn_DiscountAccSettings where FinancialYear = @FinancialYear	
	-- خدمات
	delete from cmn_ServiceAccSettings where FinancialYear = @FinancialYear
	-- کدینگ انبارها
	delete from cmn_StuffLocationAccSettings where FinancialYear = @FinancialYear
	-- KRF !!!!!
	
	-- تنظیمات سال مالی	
	delete from cmn_FinancialGroups where FinancialYear = @FinancialYear	
	--delete floatAccounts
	delete from cmn_FloatPriorities where FinancialYear = @FinancialYear
	
	delete from acc_ProjectGroupAccounts 
	where Account in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear)
	
	delete from acc_PersonGroupAccounts
	where Account in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear)
	
	delete from acc_CostCenterGroupAccounts
	where Account in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear)
	
	delete from cmn_BankAccountAccSettings
	where AccountInCoding in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear) or
		HesabeAsnadeDarJaryaneVosool in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear) or
		HesabeAsnadePardakhtani in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear) or
		HesabeCheqeZemanat in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear)
	
	delete from acc_ForeignCurrencyGroupAccounts
	where Account in 
		(select ID from acc_Accounts where FinancialYear = @FinancialYear)
	
	--delete accounts
	delete from acc_Accounts
	where FinancialYear = @FinancialYear and
		AccountLevel in (select ID from afw_OptionSetItems where Name = 'Tafsili')
	
	delete from acc_Accounts
	where FinancialYear = @FinancialYear and
		AccountLevel in (select ID from afw_OptionSetItems where Name = 'Moin')
	
	delete from acc_Accounts
	where FinancialYear = @FinancialYear and
		AccountLevel in (select ID from afw_OptionSetItems where Name = 'Kol')		
end
go
