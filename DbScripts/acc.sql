if not exists (select 1 from sys.indexes where name = 'IX_acc_AccDocItems__IsActive')
	create NONCLUSTERED index IX_acc_AccDocItems__IsActive on acc_AccDocItems(IsActive)
		include (AccDoc,Account,CreditorAmount,DebtorAmount)
	-- created for acc.GetAccountDaftarData in MegaModavem
	-- slow query without index: exec acc.GetAccountDaftarData 'd147a35d-5867-499b-9848-f335e96325da', 'edac5945-faf3-48bc-a231-affb6a85e730', null, null, '2017/3/21', '2018/3/20', null, null, null, null, 1, null , null, 0, null, null
	go

if not exists (select 1 from sys.indexes where name = 'IX_acc_Accounts_AccountLevel')
	create NONCLUSTERED index IX_acc_Accounts_AccountLevel on acc_Accounts(AccountLevel)
		include (AccountNature)
go

if not exists (select 1 from sys.indexes where name = 'IX_acc_AccDocItems__Account__IsActive__AccDoc')
	create NONCLUSTERED index IX_acc_AccDocItems__Account__IsActive__AccDoc on acc_AccDocItems(Account, IsActive, AccDoc)
		include (CreditorAmount, DebtorAmount)
	-- created for acc.GenerateAccountReview
go

if not exists (select 1 from sys.indexes where name = 'IX_acc_AccDocs__IsActive__IssueDate')
	create NONCLUSTERED index IX_acc_AccDocs__IsActive__IssueDate on acc_AccDocs(IsActive, IssueDate)
		include (ID, DocNo, FinancialYear, FinancialDocType, OrganizationUnit)
	-- created for acc.GenerateAccountReview
go

if not exists (select 1 from sys.indexes where name = 'IX_acc_AccDocItems__Person__CostCenter__Account')
	create NONCLUSTERED index IX_acc_AccDocItems__Person__CostCenter__Account on acc_AccDocItems(Person, CostCenter)
		include(Account)
	-- created for acc.GenerateAccountReview
go

afw.BeforeAlterView 'acc_AccountsView'
go
alter view acc_AccountsView as
	select Account.*,
		AccountGroup.ID GroupID,
		AccountGroup.Title AccountGroup_Title,
		case when AccountLevel.Name = 'Kol' then Account.ID
			when AccountLevel.Name = 'Moin' then ParentAccount1.ID 
			when AccountLevel.Name = 'Tafsili' then ParentAccount2.ID 
		end KolID,
		case when AccountLevel.Name = 'Kol' then Account.Code
			when AccountLevel.Name = 'Moin' then ParentAccount1.Code
			when AccountLevel.Name = 'Tafsili' then ParentAccount2.Code
		end KolCode,
		case when AccountLevel.Name = 'Kol' then Account.Name
			when AccountLevel.Name = 'Moin' then ParentAccount1.Name
			when AccountLevel.Name = 'Tafsili' then ParentAccount2.Name
		end KolName,
		case when AccountLevel.Name = 'Kol' then Account.AccountNature
			when AccountLevel.Name = 'Moin' then ParentAccount1.AccountNature 
			when AccountLevel.Name = 'Tafsili' then ParentAccount2.AccountNature 
		end KolAccountNature,
		case when AccountLevel.Name = 'Moin' then Account.ID 
			when AccountLevel.Name = 'Tafsili' then ParentAccount1.ID
			else null
		end MoinID,
		case when AccountLevel.Name = 'Moin' then Account.Code 
			when AccountLevel.Name = 'Tafsili' then ParentAccount1.Code
			else null
		end MoinCode,
		case when AccountLevel.Name = 'Moin' then Account.Name 
			when AccountLevel.Name = 'Tafsili' then ParentAccount1.Name
			else null
		end MoinName,
		case when AccountLevel.Name = 'Tafsili' then Account.ID
			else null
		end TafsiliID,
		case when AccountLevel.Name = 'Tafsili' then Account.Code
			else null
		end TafsiliCode,
		case when AccountLevel.Name = 'Tafsili' then Account.Name
			else null
		end TafsiliName,
		isnull(AccountGroup.GroupCode + ' - ', '')
			+ isnull(ParentAccount2.Code + ' - ', '')
			+ isnull(ParentAccount1.Code + ' - ', '') 
			+ isnull(Account.Code, '') FullCodeWithGroupCode,
		isnull(ParentAccount2.Code + ' - ', '')
			+ isnull(ParentAccount1.Code + ' - ', '') 
			+ isnull(Account.Code, '') FullCode,
		isnull(ParentAccount2.Name + ' - ', '') 
			+ isnull(ParentAccount1.Name + ' - ', '') 
			+ Account.Name FullName,
		isnull(AccountGroup.GroupCode + ' - ', '')
			+ isnull(ParentAccount2.Code + ' - ', '')
			+ isnull(ParentAccount1.Code + ' - ', '') 
			+ isnull(Account.Code, '') 
			+ isnull(' - ' + Account.Name, '') CodeAndName, 
		isnull(AccountGroup.GroupCode + ' - ', '')
			+ isnull(ParentAccount2.Code + ' - ', '')
			+ isnull(ParentAccount1.Code + ' - ', '') 
			+ isnull(Account.Code, '') 
			+ isnull(ParentAccount2.Name + ' - ', '') 
			+ isnull(ParentAccount1.Name + ' - ', '') 
			+ Account.Name FullCodeAndFullName, 
			
		AccountLevel.Name AccountLevel_Name
	from acc_Accounts Account 
		inner join afw_OptionSetItems AccountLevel on AccountLevel.ID = Account.AccountLevel
		left join acc_Accounts ParentAccount1 on ParentAccount1.ID = Account.ParentAccount
		left join afw_OptionSetItems ParentAccount1Level on ParentAccount1Level.ID = ParentAccount1.AccountLevel                        
		left join acc_Accounts ParentAccount2 on ParentAccount2.ID = ParentAccount1.ParentAccount
		left join afw_OptionSetItems ParentAccount2Level on ParentAccount2Level.ID = ParentAccount2.AccountLevel
		left join acc_AccountGroups AccountGroup on AccountGroup.ID = 
			coalesce(Account.AccountGroup, ParentAccount1.AccountGroup, ParentAccount2.AccountGroup)
go

afw.BeforeAlterView 'acc_LastLevelAccountsView'
go
alter view acc_LastLevelAccountsView as
	select Account.ID, Account.FinancialYear, PPAccount.Code PPAccountCode, PAccount.Code PAccountCode, Account.Code AccountCode,
		AccountLevel.Name LevelName, AccountLevel.Title Level_Text,
		coalesce(PPAccount.Code + ' - ', '') + coalesce(PAccount.Code + ' - ', '') + isnull(Account.Code, '') +
		coalesce(' - ' + PPAccount.Name, '') + coalesce(' - ' + PAccount.Name, '') + coalesce(' - ' + Account.Name, '') CodeAndName
	from acc_Accounts Account
		left join acc_Accounts ChildAccount on ChildAccount.ParentAccount = Account.ID  
		left join acc_Accounts PAccount on PAccount.ID = Account.ParentAccount
		left join acc_Accounts PPAccount on PPAccount.ID = PAccount.ParentAccount
		left join afw_OptionSetItems AccountLevel on AccountLevel.ID = Account.AccountLevel
	where ChildAccount.ID is null 
go

afw.BeforeAlterSF 'acc.ToComparableAccountFullCodeWithGroupCode'
go
alter function acc.ToComparableAccountFullCodeWithGroupCode(
	@AccountFullCode varchar(44))
	returns varchar(50) as
begin

	if(@AccountFullCode is null)
		return null;
		
	declare @Dash1Index int
	declare @Dash2Index int
	declare @Dash3Index int

	set @Dash1Index = CHARINDEX('-', @AccountFullCode, 0)
	
	if(@Dash1Index <> 0)
		set @Dash2Index = CHARINDEX('-', @AccountFullCode, @Dash1Index + 1)
	else
		set @Dash2Index = 0
	
	if(@Dash2Index <> 0)		
		set @Dash3Index = CHARINDEX('-', @AccountFullCode, @Dash2Index + 1)
	else
		set @Dash3Index = 0
		
	--select @Dash1Index, @Dash2Index, @Dash3Index

	declare @GroupCode varchar(10)
	declare @KolCode varchar(10) 
	declare @MoinCode varchar(10)
	declare @TafsiliCode varchar(10)

	if(@Dash1Index <> 0)
		set @GroupCode = SUBSTRING(@AccountFullCode, 0, @Dash1Index - 1)
	else
		set @GroupCode = '0'
	
	if(@Dash2Index <> 0)		
		set @KolCode = SUBSTRING(@AccountFullCode, @Dash1Index + 2, @Dash2Index - @Dash1Index - 3)
	else if (@Dash2Index = 0 and @Dash1Index <> 0)
		set @KolCode = SUBSTRING(@AccountFullCode, @Dash1Index + 2, 10)
	else
		set @KolCode = '0'
	
	if(@Dash3Index <> 0)	
		set @MoinCode = SUBSTRING(@AccountFullCode, @Dash2Index + 2, @Dash3Index - @Dash2Index - 3)	
	else if (@Dash3Index = 0 and @Dash2Index <> 0)
		set @MoinCode = SUBSTRING(@AccountFullCode, @Dash2Index + 2, 10)	
	else
		set @MoinCode = '0'
		
	if(@Dash3Index <> 0)	
		set @TafsiliCode = SUBSTRING(@AccountFullCode, @Dash3Index + 2, 10)
	else
		set @TafsiliCode = '0'
		
	--select @GroupCode, @KolCode, @MoinCode, @TafsiliCode

	declare @ComparableAccountFullCodeWithGroupCode varchar(50)

	set @ComparableAccountFullCodeWithGroupCode = REPLICATE('0', 10 - LEN(@GroupCode)) + @GroupCode	+ '-'
		+ REPLICATE('0', 10 - LEN(@KolCode)) + @KolCode + '-'
		+ REPLICATE('0', 10 - LEN(@MoinCode)) + @MoinCode + '-'
		+ REPLICATE('0', 10 - LEN(@TafsiliCode)) + @TafsiliCode

	return @ComparableAccountFullCodeWithGroupCode
end
go

afw.BeforeAlterIF 'acc.GetAccountAndChildsDocsAmountSum'
go
alter function acc.GetAccountAndChildsDocsAmountSum (
	@AccountID uniqueidentifier,
	@FinancialYear uniqueidentifier,
	@FinancialGroup uniqueidentifier,
	@FromDate date,
	@ToDate date
	) returns table as 
	return	
		select sum(AccDocItem.DebtorAmount) DebtorAmountSum,
			sum(AccDocItem.CreditorAmount) CreditorAmountSum
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and isnull(@FinancialYear, AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@FinancialGroup, AccDoc.FinancialGroup) = AccDoc.FinancialGroup
			and AccDoc.IssueDate between isnull(@FromDate, AccDoc.IssueDate) and isnull(@ToDate, AccDoc.IssueDate) 
go

afw.BeforeAlterProc 'acc.GetShenavarhaReports'
go
alter procedure [acc].[GetShenavarhaReports]
	@FromDate date,
	@ToDate date,
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier,
	@OrganizationUnit uniqueidentifier,
	@Person uniqueidentifier,
	@CostCenter uniqueidentifier,
	@Project uniqueidentifier,
	@ForeignCurrency uniqueidentifier,
	@Account uniqueidentifier,
	@PrintMode bit,
	@FilterExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@StartRecordNumber int,
	@MaxRecords int
as
begin 
	--set parameters whene they are null for report
	declare @ZeroUniqueidentifierValue nvarchar(50) = '00000000-0000-0000-0000-000000000000'
	if @FinancialDocType = @ZeroUniqueidentifierValue set @FinancialDocType = null
	if @OrganizationUnit = @ZeroUniqueidentifierValue set @OrganizationUnit = null
	if @Person = @ZeroUniqueidentifierValue set @Person = null
	if @CostCenter = @ZeroUniqueidentifierValue set @CostCenter = null
	if @Project = @ZeroUniqueidentifierValue set @Project = null
	if @ForeignCurrency = @ZeroUniqueidentifierValue set @ForeignCurrency = null
	if @Account = @ZeroUniqueidentifierValue set @Account = null
	
	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @SortExpression is null set @SortExpression = N'RowNumber'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000
		
	declare @FinancialYearStartDate date;
	
	select @FromDate = isnull(@FromDate, StartDate),
		@ToDate = isnull(@ToDate, EndDate),
		@FinancialYearStartDate = StartDate
	from cmn_FinancialYears
	where ID = @FinancialYear

	set fmtonly off
	if exists (select * from tempdb.dbo.sysobjects O where O.xtype in ('U') and O.ID = object_id(N'tempdb..#TempTable'))
		drop table #TempTable
	set nocount on;
	 
	create table #TempTable
		(RowNumber int identity(1,1),
		 Account uniqueidentifier,
		 AccDoc uniqueidentifier,
		 AccDocItemID uniqueidentifier,
		 DocNumber int,
		 RefType nvarchar(15),
		 RefNumber int,
		 SalesInvoice uniqueidentifier,
		 ReceiveReceipt uniqueidentifier,
		 PayReceipt uniqueidentifier,
		 ReceivedChequeStatusChange uniqueidentifier,
	     PaidChequeStatusChange	uniqueidentifier,
		 DocName nvarchar(50),
		 IssueDate nvarchar(10),
		 Note nvarchar(max),
		 FinancialDocType uniqueidentifier,  
		 OrganizationUnit uniqueidentifier,  
		 Person uniqueidentifier,
		 CostCenter uniqueidentifier,
		 Project uniqueidentifier,
		 ForeignCurrency uniqueidentifier,
		 IsActive bit,
		 BalanceStatus nvarchar(10),
		 DebtorAmount bigint, 
		 CreditorAmount bigint,
		 RemainingAmount varchar(20),
		 TotalRecordsCount int,
		 DebtorAmountSum decimal(38,2),  
		 CreditorAmountSum decimal(38,2), 
		 RemainingAmountSum decimal(38,2))		 
		 
	--منقول از قبل تاریخ
	if(@FromDate > @FinancialYearStartDate)
	begin
	insert into #TempTable(Note,DebtorAmount, CreditorAmount)	
	select N'منقول از قبل', 
		isnull(sum(SubQuery.DebtorAmount), 0) DebtorAmount,
		isnull(sum(SubQuery.CreditorAmount),0) CreditorAmount
	from (
		select sum(AccDocItem.DebtorAmount) DebtorAmount,
			sum(AccDocItem.CreditorAmount) CreditorAmount
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = AccDoc.FinancialDocType
		where (@Account is null or AccDocItem.Account = @Account) and
			 AccDoc.IsActive = 1 and AccDocItem.IsActive = 1 and
			 AccDoc.IssueDate >= @FinancialYearStartDate and AccDoc.IssueDate < @FromDate and 	 						
			 isnull(@FinancialYear , AccDoc.FinancialYear) = AccDoc.FinancialYear and
			 isnull(@FinancialDocType, AccDoc.FinancialDocType) = AccDoc.FinancialDocType and
			 isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)
			) SubQuery
	end
		 
	insert into #TempTable (--RowNumber,
			Account,
			AccDoc,
			AccDocItemID,
			DocNumber,
			RefType,
			RefNumber,
			SalesInvoice,
			ReceiveReceipt,
			PayReceipt,
			ReceivedChequeStatusChange,
			PaidChequeStatusChange,
			DocName,
			IssueDate,
			Note,
			FinancialDocType,
			OrganizationUnit,  
			Person,
			CostCenter,
			Project,
			ForeignCurrency,
			IsActive,
			BalanceStatus,
			DebtorAmount, 
			CreditorAmount,
			RemainingAmount)

	select * 
	from (
		select AccDocItem.Account,
			AccDoc.ID DocID,
			AccDocItem.ID DocItemID,
			AccDoc.DocNo,
			N'سند حسابداری' RefType,
			0 RefNumber,
			AccDocItem.RefOp_SalesInvoice,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'' BalanceStatus,
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0 RemainingAmount
		from acc_AccDocItems AccDocItem
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account) and
			AccDocItem.RefOp_BuyInvoice is null and AccDocItem.RefOp_SalesInvoice is null and 
			AccDocItem.RefOp_ReceiveReceipt is null and AccDocItem.RefOp_ReceivedChequeStatusChange is null and
			AccDocItem.RefOp_PayReceipt is null and AccDocItem.RefOp_PaidChequeStatusChange is null and 
			AccDocItem.RefOp_Tankhah is null
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'رسید دریافت',
			ReceiveReceipt.ReceiptNumber,
			AccDocItem.RefOp_SalesInvoice,
			ReceiveReceipt.ID,
			AccDocItem.RefOp_PayReceipt,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem
			inner join rp_ReceiveReceipts ReceiveReceipt on ReceiveReceipt.ID = AccDocItem.RefOp_ReceiveReceipt
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account) 
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'رسید پرداخت',
			PayReceipt.ReceiptNumber,
			AccDocItem.RefOp_SalesInvoice,
			AccDocItem.RefOp_ReceiveReceipt,
			PayReceipt.ID,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem 
			inner join rp_PayReceipts PayReceipt on PayReceipt.ID = AccDocItem.RefOp_PayReceipt 
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account) 
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'چک دریافتی',
			ReceivedCheque.ChequeNumber,
			AccDocItem.RefOp_SalesInvoice,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			ReceivedChequeStatusChange.ID,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem 
 			inner join rp_ReceivedChequeStatusChanges ReceivedChequeStatusChange on ReceivedChequeStatusChange.ID = AccDocItem.RefOp_ReceivedChequeStatusChange
			inner join rp_ReceivedCheques ReceivedCheque on ReceivedCheque.ID = ReceivedChequeStatusChange.Cheque
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account) 
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'چک پرداختی',
			PaidCheque.ChequeNumber,
			AccDocItem.RefOp_SalesInvoice,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			PaidChequeStatusChange.ID,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem 
 			inner join rp_PaidChequeStatusChanges PaidChequeStatusChange on AccDocItem.RefOp_PaidChequeStatusChange = PaidChequeStatusChange.ID
			inner join rp_PaidCheques PaidCheque on PaidCheque.ID = PaidChequeStatusChange.Cheque
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account) 
		
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'تنخواه',
			Tankhah.TankhahNo,
			Tankhah.ID,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem
			inner join rp_Tankhahha Tankhah on Tankhah.ID = AccDocItem.RefOp_Tankhah 
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account)

		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'فاکتور خرید',
			BuyInvoice.InvoiceNumber,
			BuyInvoice.ID,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem
			inner join ps_BuyInvoices BuyInvoice on BuyInvoice.ID = AccDocItem.RefOp_BuyInvoice
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account)
		union  
		select AccDocItem.Account,
			AccDoc.ID,
			AccDocItem.ID,
			AccDoc.DocNo,
			N'فاکتور فروش',
			SalesInvoice.InvoiceNumber,
			SalesInvoice.ID,
			AccDocItem.RefOp_ReceiveReceipt,
			AccDocItem.RefOp_PayReceipt,
			AccDocItem.RefOp_ReceivedChequeStatusChange,
			AccDocItem.RefOp_PaidChequeStatusChange,
			DocKind.Title DocName,
			substring (cast(afw.GregorianToPersian(AccDoc.IssueDate)as nvarchar) ,0,len(afw.GregorianToPersian(AccDoc.IssueDate)) + 2) IssueDate,
			AccDocItem.Note,
			AccDoc.FinancialDocType, 
			AccDoc.OrganizationUnit, 
			AccDocItem.Person,
			AccDocItem.CostCenter,
			AccDocItem.Project,
			AccDocItem.ForeignCurrency,
			AccDocItem.IsActive,
			'',
			case when @ForeignCurrency is null then AccDocItem.DebtorAmount else case when isnull(CurrencyDebtorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end DebtorAmount,
			case when @ForeignCurrency is null then AccDocItem.CreditorAmount else case when isnull(CurrencyCreditorRatio, 0) = 0 then 0 else AccDocItem.CurrencyAmount end end CreditorAmount,
			0
		from acc_AccDocItems AccDocItem 
			inner join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = AccDocItem.RefOp_SalesInvoice
			inner join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			inner join acc_DocKinds DocKind on DocKind.ID = AccDoc.DocKind
		where AccDocItem.IsActive = 1 and AccDoc.IsActive = 1 and
			cast(AccDoc.IssueDate as date) >=  @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate and
			(@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) and
			(@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit) and
			(@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType) and
			(@Person is null or AccDocItem.Person = @Person) and
			(@CostCenter is null or AccDocItem.CostCenter = @CostCenter) and
			(@Project is null or AccDocItem.Project = @Project)and
			(@ForeignCurrency is null or AccDocItem.ForeignCurrency = @ForeignCurrency)and
			(@Account is null or AccDocItem.Account = @Account)) t
	order by t.IssueDate, t.DocNo, t.CreditorAmount
				
	declare @query nvarchar(max)
	set @query = 'delete from #TempTable where not( '+@FilterExpression+' )'
	exec sp_executesql @query
	
	declare @RowNumber int,
			@RefNumber int,
			@ReceiveReceipt uniqueidentifier, 
			@PayReceipt uniqueidentifier, 
			@ReceivedChequeStatusChange uniqueidentifier, 
			@PaidChequeStatusChange uniqueidentifier,
			@DocName nvarchar(50),
			@BalanceStatus nvarchar(10),
			@DebtorAmount bigint,
			@CreditorAmount bigint,
			@RemainingAmount decimal

	set @RemainingAmount = 0

	declare  tempTableCursor cursor 

	for select  RefNumber, RowNumber, ReceiveReceipt, PayReceipt, ReceivedChequeStatusChange, 
				PaidChequeStatusChange, DebtorAmount,CreditorAmount 
	from #TempTable
	order by #TempTable.IssueDate, #TempTable.DocNumber, #TempTable.CreditorAmount
	open    tempTableCursor
	fetch next from tempTableCursor
		into    @RefNumber, @RowNumber, @ReceiveReceipt, @PayReceipt, @ReceivedChequeStatusChange, 
				@PaidChequeStatusChange, @DebtorAmount, @CreditorAmount
		while  @@FETCH_STATUS = 0

		begin
			if @ReceiveReceipt is not null begin select @RefNumber = rp_ReceiveReceipts.ReceiptNumber from rp_ReceiveReceipts where ID = @ReceiveReceipt set @DocName = N'رسید دریافت' end
			if @PayReceipt is not null begin select @RefNumber = rp_PayReceipts.ReceiptNumber from rp_PayReceipts where ID = @PayReceipt set @DocName = N'رسید پرداخت' end
			if @ReceivedChequeStatusChange is not null begin select @RefNumber = rp_ReceivedCheques.ChequeNumber 
														from  rp_ReceivedChequeStatusChanges
															inner join rp_ReceivedCheques on rp_ReceivedCheques.ID = rp_ReceivedChequeStatusChanges.Cheque
														where rp_ReceivedChequeStatusChanges.ID = @ReceivedChequeStatusChange set @DocName = N'چک دریافتی' end
			if @PaidChequeStatusChange is not null	begin	select @RefNumber = rp_PaidCheques.ChequeNumber  
														from  rp_PaidChequeStatusChanges
															inner join rp_PaidCheques on rp_PaidCheques.ID = rp_PaidChequeStatusChanges.Cheque
														where rp_PaidChequeStatusChanges.ID = @PaidChequeStatusChange set @DocName = N'چک پرداختی' end
			if @ReceiveReceipt is null and @PayReceipt is null and @ReceivedChequeStatusChange is null and @PaidChequeStatusChange is null set @DocName = N'سند مرکب'
			
			select @DebtorAmount = DebtorAmount, @CreditorAmount = CreditorAmount from #TempTable where RowNumber = @RowNumber 
			select @RemainingAmount =  (@CreditorAmount + @RemainingAmount)  - @DebtorAmount
			if @RemainingAmount > 0 begin select @BalanceStatus = N'بستانکار' end
			if @RemainingAmount < 0 begin select @BalanceStatus = N'بدهکار' end
			if @RemainingAmount = 0 begin select @BalanceStatus = N'بی حساب' end 

			update #TempTable set	
				RefNumber = @RefNumber,
				RemainingAmount = 
				case when @RemainingAmount <= 0 then afw.FormatNumber(@RemainingAmount * -1)
					else '(' + afw.FormatNumber(@RemainingAmount) + ')'
				end,
				DocName = @DocName, 
				BalanceStatus = @BalanceStatus 
			where RowNumber = @RowNumber 
			 
		FETCH Next FROM tempTableCursor		
	    INTO	@RefNumber,@RowNumber, @ReceiveReceipt, @PayReceipt, @ReceivedChequeStatusChange, 
				@PaidChequeStatusChange, @DebtorAmount, @CreditorAmount
		end

	close tempTableCursor 

	deallocate tempTableCursor 
	
	update #TempTable
	set TotalRecordsCount = (select count(1) from #TempTable),
		DebtorAmountSum = (select sum(DebtorAmount) from #TempTable),
		CreditorAmountSum = (select sum(CreditorAmount) from #TempTable),
		RemainingAmountSum = 0

--apply print extra rows (منقول از صفحه قبل)
	if @PrintMode = 1
	begin 	
		declare @RowsCount int;
		declare @I int;
		declare @insertToRowNumber int;
		declare @rowcounter int;	

		select @I = 1, 
			@RemainingAmount = 0,
			@insertToRowNumber = 0,
			@rowcounter = 0,
			@RowsCount = count(1) from #TempTable;
	
		create table #PrintResultTable
		(
			RowNumber int,
			AccDocID uniqueidentifier, 
			DocReferenceNo int, IssueDate_Persian nvarchar(10), 
			FinancialDocType_Title nvarchar(20), Description nvarchar(2000), 
			DebtorAmount decimal(38,2), CreditorAmount decimal(38,2), 
			RemainingAmount varchar(20), BalanceStatus nvarchar(8), 
			DebtorAmountSum decimal(38,2), CreditorAmountSum decimal(38,2),
			TotalRecordsCount int,
		)
		
		while @I <= @RowsCount
		begin	
			if(@rowcounter >12 and @I > 14)
				begin				
					print (@insertToRowNumber )
					print (@rowcounter)	
					print(@I)
					select @insertToRowNumber = @insertToRowNumber + 1 ,
						@rowcounter = 0;
				end	
						
			insert into #PrintResultTable (AccDocID , 
				DocReferenceNo, IssueDate_Persian , 
				FinancialDocType_Title, Description , 
				DebtorAmount, CreditorAmount , 
				RemainingAmount , BalanceStatus , 
				DebtorAmountSum , CreditorAmountSum ,
				TotalRecordsCount, RowNumber
			)
			select TempTable.AccDoc , 
				TempTable.DocNumber , TempTable.IssueDate,
				FinancialDocType.Title,
				case  
					when len(TempTable.Note)> 140 then substring(TempTable.Note, 0, 140) + '...' 
					else TempTable.Note
				end Description,				 
				DebtorAmount, CreditorAmount , 
				RemainingAmount , BalanceStatus , 
				DebtorAmountSum , CreditorAmountSum ,
				TotalRecordsCount,
				RowNumber + @insertToRowNumber RowNumber
			from #TempTable TempTable
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = TempTable.FinancialDocType
			where RowNumber = @I
			
			set @rowcounter = @rowcounter + 1;
			
			if @I = 14
			begin
				insert into #PrintResultTable (RowNumber, Description, DebtorAmount, CreditorAmount)	
				select RowNumber,
					N'‹-- منقول از صفحه قبل ',
					isnull(DebtorAmountُُSum, 0) DebtorAmount,
					isnull(CreditorAmountSum,0) CreditorAmount
				from ( 
					select sum(R.DebtorAmount) DebtorAmountُُSum,
						sum(R.CreditorAmount) CreditorAmountSum,
						RowNumber = @I + 1
					from #TempTable R
					where R.RowNumber <= @I
					) SubQuery	
				
				update PrintResultTable
					set  RemainingAmount =(select RemainingAmount from #TempTable where RowNumber = @I)
						, BalanceStatus	= (select BalanceStatus from #TempTable where RowNumber = @I)	
				from #PrintResultTable PrintResultTable
				where PrintResultTable.RowNumber = @I + 1
			end
			
			if @rowcounter = 13 and @I > 15
			begin
				insert into #PrintResultTable (RowNumber, Description, DebtorAmount, CreditorAmount)	
				select @I+ @insertToRowNumber+ 1,
					N'‹-- منقول از صفحه قبل ',
					isnull(DebtorAmountُُSum, 0) DebtorAmount,
					isnull(CreditorAmountSum,0) CreditorAmount
				from ( 
					select sum(R.DebtorAmount) DebtorAmountُُSum,
						sum(R.CreditorAmount) CreditorAmountSum
					from #PrintResultTable R
					where R.RowNumber between @I+ @insertToRowNumber - 13 and @I+ @insertToRowNumber
					) SubQuery	
					
				update PrintResultTable
					set  RemainingAmount =(select RemainingAmount from #TempTable where RowNumber = @I)
						, BalanceStatus	= (select BalanceStatus from #TempTable where RowNumber = @I)	
				from #PrintResultTable PrintResultTable
				where PrintResultTable.RowNumber = @I+ @insertToRowNumber+ 1		
			end
			
			select @I = @I + 1
		end
	
		declare @PrintSqlQuery nvarchar(4000)
		set @PrintSqlQuery = 
			'select * 
			from #PrintResultTable 
			order by '+@SortExpression + ' ';

		exec (@PrintSqlQuery)
	
	end
	
	--apply paging:
	if @PrintMode = 0
	begin
		declare @PagingSqlQuery nvarchar(4000)
		set @PagingSqlQuery = '
			select top ' + cast(@MaxRecords as nvarchar) + ' *
			from (
				select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
				from (
					select * 
					from #TempTable ) NotPagedQuery
			) NotPagedQuery2
			where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
			'order by NotPagedQuery2._PagingRowNumber '

			print @MaxRecords
			print @PagingSqlQuery

		exec (@PagingSqlQuery)
	end
	--select * from #TempTable 
end
go

--exec acc.GetShenavarhaReports '2017/3/21', '2018/3/20', '81a14478-ba8e-4015-ba7d-c8039b8c36b0' , null, null, 'b46ecd1b-f5f4-4c64-a26c-025132714ae5', null, null, null, null, 1, null,null,null,null

afw.BeforeAlterProc 'acc.GetAccountDaftarData'
go
alter procedure acc.GetAccountDaftarData 
	@AccountID uniqueidentifier,
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier,
	@OrganizationUnit uniqueidentifier,
	@FromDate date,
	@ToDate date, 
	@FromDocReferenceNo int,
	@ToDocReferenceNo int, 
	@ShenavarType nvarchar(20),
	@ShenavarID uniqueidentifier,
	@BeTafkik bit,
	@FilterExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@PrintMode bit,
	@StartRecordNumber int,
	@MaxRecords int
as
set fmtonly off
begin

	declare @FinancialYearStartDate date
	
	select @FromDate = isnull(@FromDate, StartDate),
		@ToDate = isnull(@ToDate, EndDate),
		@FinancialYearStartDate = StartDate
	from cmn_FinancialYears
	where ID = @FinancialYear

	declare @DocStatus_NotChecked uniqueidentifier --اسناد تنظیم نشده در مرور حساب و ... نیاید
	select @DocStatus_NotChecked = ID from afw_OptionSetItemsView where FullName = 'acc.DocStatus.NotChecked'

	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @SortExpression is null set @SortExpression = N'RowNumber'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000
 
	create table #ResultTable
	(
		RowNumber int,
		AccDocID uniqueidentifier, 
		DocReferenceNo nvarchar(10), IssueDate varchar(10), IssueDate_Persian varchar(10), 
		FinancialDocType_Title nvarchar(20), Description nvarchar(2000), 
		DebtorAmount decimal(38,2), CreditorAmount decimal(38,2), 
		RemainingAmount varchar(20), BalanceStatus nvarchar(8), 
		DebtorAmountSum decimal(38,2), CreditorAmountSum decimal(38,2),
		TotalRecordsCount int,
	)
	
	--منقول از قبل تاریخ
	if(@FromDate > @FinancialYearStartDate)
	begin
	insert into #ResultTable(Description,DebtorAmount, CreditorAmount)	
	select N'منقول از قبل', 
		isnull(sum(SubQuery.DebtorAmount), 0) DebtorAmount,
		isnull(sum(SubQuery.CreditorAmount),0) CreditorAmount
	from (
		select sum(AccDocItem.DebtorAmount) DebtorAmount,
			sum(AccDocItem.CreditorAmount) CreditorAmount
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = AccDoc.FinancialDocType
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and AccDoc.DocStatus <> @DocStatus_NotChecked
			and AccDoc.IssueDate >= @FinancialYearStartDate and AccDoc.IssueDate < @FromDate 							
			and isnull(@FinancialYear , AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@FinancialDocType, AccDoc.FinancialDocType) = AccDoc.FinancialDocType 
			and isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit
			and (@ShenavarType is null 
				or (
					(@ShenavarType = 'Person' and AccDocItem.Person = @ShenavarID) 
					or (@ShenavarType = 'CostCenter' and AccDocItem.CostCenter = @ShenavarID) 
					or (@ShenavarType =  'Project' and AccDocItem.Project = @ShenavarID)
					or (@ShenavarType =  'OrganizationUnit' and AccDocItem.OrganizationUnit = @ShenavarID)
					)
				) 
			) SubQuery
	end
	
	--منقول از قبل سند
	else if(@FromDocReferenceNo is not null)
	begin
	insert into #ResultTable(Description,DebtorAmount, CreditorAmount)	
	select N'منقول از قبل', 
		isnull(sum(SubQuery.DebtorAmount), 0) DebtorAmount,
		isnull(sum(SubQuery.CreditorAmount),0) CreditorAmount
	from (
		select sum(AccDocItem.DebtorAmount) DebtorAmount,
			sum(AccDocItem.CreditorAmount) CreditorAmount
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = AccDoc.FinancialDocType
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and AccDoc.DocStatus <> @DocStatus_NotChecked
			and AccDoc.DocNo < @FromDocReferenceNo 	
			and AccDoc.IssueDate between @FromDate and @ToDate 						
			and isnull(@FinancialYear , AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@FinancialDocType, AccDoc.FinancialDocType) = AccDoc.FinancialDocType
			and isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit
			and (@ShenavarType is null 
				or (
					(@ShenavarType = 'Person' and AccDocItem.Person = @ShenavarID) 
					or (@ShenavarType = 'CostCenter' and AccDocItem.CostCenter = @ShenavarID) 
					or (@ShenavarType =  'Project' and AccDocItem.Project = @ShenavarID)
					or (@ShenavarType =  'OrganizationUnit' and AccDocItem.OrganizationUnit = @ShenavarID)
					)
				) 
			) SubQuery
	end
	
	if (@BeTafkik = 1)
	begin
		insert into #ResultTable(AccDocID, 
			DocReferenceNo, IssueDate, 
			FinancialDocType_Title, Description,
			DebtorAmount, CreditorAmount)	
		select AccDoc.ID, 
			AccDoc.DocNo, AccDoc.IssueDate, 
			FinancialDocType.Title, AccDocItem.Note,			
			AccDocItem.DebtorAmount, AccDocItem.CreditorAmount
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = AccDoc.FinancialDocType
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and AccDoc.DocStatus <> @DocStatus_NotChecked
			and AccDoc.IssueDate between @FromDate and @ToDate 
			and AccDoc.DocNo between isnull(@FromDocReferenceNo,AccDoc.DocNo) and isnull( @ToDocReferenceNo,AccDoc.DocNo)
			and isnull(@FinancialYear , AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@FinancialDocType, AccDoc.FinancialDocType) = AccDoc.FinancialDocType
			and isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit
			and (@ShenavarType is null 
				or (
					(@ShenavarType = 'Person' and AccDocItem.Person = @ShenavarID) 
					or (@ShenavarType = 'CostCenter' and AccDocItem.CostCenter = @ShenavarID) 
					or (@ShenavarType =  'Project' and AccDocItem.Project = @ShenavarID)
					or (@ShenavarType =  'OrganizationUnit' and AccDocItem.OrganizationUnit = @ShenavarID)
					)
				) 
	end
	else
	begin
		insert into #ResultTable(AccDocID, 
			DocReferenceNo, IssueDate, 
			FinancialDocType_Title,
			DebtorAmount, CreditorAmount)	
		select AccDoc.ID AccDocID, 
			AccDoc.DocNo, AccDoc.IssueDate, 
			FinancialDocType.Title FinancialDocType_Title,
			sum(AccDocItem.DebtorAmount) DebtorAmount,
			sum(AccDocItem.CreditorAmount) CreditorAmount
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
			left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = AccDoc.FinancialDocType
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and AccDoc.DocStatus <> @DocStatus_NotChecked
			and AccDoc.IssueDate between @FromDate and @ToDate 
			and AccDoc.DocNo between isnull(@FromDocReferenceNo,AccDoc.DocNo) and isnull( @ToDocReferenceNo,AccDoc.DocNo)
			and isnull(@FinancialYear , AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@FinancialDocType, AccDoc.FinancialDocType) = AccDoc.FinancialDocType
			and isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit
			and (@ShenavarType is null 
				or (
					(@ShenavarType = 'Person' and AccDocItem.Person = @ShenavarID) 
					or (@ShenavarType = 'CostCenter' and AccDocItem.CostCenter = @ShenavarID) 
					or (@ShenavarType =  'Project' and AccDocItem.Project = @ShenavarID)
					or (@ShenavarType =  'OrganizationUnit' and AccDocItem.OrganizationUnit = @ShenavarID)
					)
				) 
		group by AccDoc.ID,
			AccDoc.DocNo, AccDoc.IssueDate,
			FinancialDocType.Title,
			case when AccDocItem.DebtorAmount > 0 then 1 else 0 end
	
		update ResultTable
		set Description = AccDoc.Description
		from #ResultTable ResultTable
			inner join acc_AccDocs AccDoc on AccDoc.ID = ResultTable.AccDocID
	end
	
	
	declare @query nvarchar(max)
	set @query = 'delete from #ResultTable where not( '+@FilterExpression+' )'
	exec sp_executesql @query	

	update ResultTable
	set RowNumber = ResultTable.CalculatedRowNumber,
		IssueDate_Persian = afw.GregorianToPersian(ResultTable.IssueDate)
	from (
		select *, 
			row_number() over (order by IssueDate, DocReferenceNo, 
				case when DebtorAmount > 0 then 0 else 1 end
			) CalculatedRowNumber		
		from #ResultTable
		) ResultTable
		
	update #ResultTable
	set DebtorAmountSum = (select sum(DebtorAmount) from #ResultTable),
		CreditorAmountSum = (select sum(CreditorAmount) from #ResultTable),
		TotalRecordsCount = (select count(1) from #ResultTable)
		
	declare @RowsCount int;
	declare @I int;
	declare @RemainingAmount decimal;
	declare @BalanceStatus nvarchar(8);
	
	select @I = 1, 
		@RemainingAmount = 0,
		@RowsCount = count(1) from #ResultTable;
	
	set @RowsCount = case when @MaxRecords  < 50 
							then @StartRecordNumber + @MaxRecords 
							else @RowsCount 
						end
	
	while @I <= @RowsCount
	begin
		select @RemainingAmount = DebtorAmount - CreditorAmount + @RemainingAmount
		from #ResultTable 
		where RowNumber = @I 

		if @RemainingAmount > 0 
			set @BalanceStatus = N'بد'
		else if @RemainingAmount < 0 
			set @BalanceStatus = N'بس' 
		else
			set @BalanceStatus = N'بی حساب'
		
		update #ResultTable 
		set RemainingAmount = 
				case when @RemainingAmount >= 0 then afw.FormatNumber(@RemainingAmount)
					else '(' + afw.FormatNumber(@RemainingAmount * -1) + ')'
				end,
			BalanceStatus = @BalanceStatus 
		where RowNumber = @I
		
		select @I = @I + 1
	end
		
	--apply print extra rows (منقول از صفحه قبل)
	if @PrintMode = 1
	begin 
		create table #PrintResultTable
		(
			RowNumber int,
			AccDocID uniqueidentifier, 
			DocReferenceNo nvarchar(10), IssueDate varchar(10), IssueDate_Persian varchar(10), 
			FinancialDocType_Title nvarchar(20), Description nvarchar(2000), 
			DebtorAmount decimal(38,2), CreditorAmount decimal(38,2), 
			RemainingAmount varchar(20), BalanceStatus nvarchar(8), 
			DebtorAmountSum decimal(38,2), CreditorAmountSum decimal(38,2),
			TotalRecordsCount int,
		)
		
		declare @insertToRowNumber int;
		declare @rowcounter int;
		
		select @I = 1,
			@insertToRowNumber = 0,
			@rowcounter = 0;

		while @I <= @RowsCount
		begin			
			if(@rowcounter >18 and @I > 20)
				begin
					select @insertToRowNumber = @insertToRowNumber + 1,
						@rowcounter = 0;
				end			
			insert into #PrintResultTable (AccDocID , 
				DocReferenceNo, IssueDate, IssueDate_Persian , 
				FinancialDocType_Title, Description , 
				DebtorAmount, CreditorAmount , 
				RemainingAmount , BalanceStatus , 
				DebtorAmountSum , CreditorAmountSum ,
				TotalRecordsCount, RowNumber
			)
			select AccDocID , 
				DocReferenceNo, IssueDate, IssueDate_Persian , 
				FinancialDocType_Title, Description , 
				DebtorAmount, CreditorAmount , 
				RemainingAmount , BalanceStatus , 
				DebtorAmountSum , CreditorAmountSum ,
				TotalRecordsCount,
				RowNumber + @insertToRowNumber RowNumber
			from #ResultTable
			where RowNumber = @I
			
			set @rowcounter = @rowcounter + 1;
			
			if @I = 20
			begin
				insert into #PrintResultTable (RowNumber, Description, DebtorAmount, CreditorAmount)	
				select RowNumber,
					N'‹-- منقول از صفحه قبل ',
					isnull(DebtorAmountُُSum, 0) DebtorAmount,
					isnull(CreditorAmountSum,0) CreditorAmount
				from ( 
					select sum(R.DebtorAmount) DebtorAmountُُSum,
						sum(R.CreditorAmount) CreditorAmountSum,
						RowNumber = @I + 1
					from #ResultTable R
					where R.RowNumber <= @I
					) SubQuery	
				
				update PrintResultTable
					set  RemainingAmount =(select RemainingAmount from #ResultTable where RowNumber = @I)
						, BalanceStatus	= (select BalanceStatus from #ResultTable where RowNumber = @I)	
				from #PrintResultTable PrintResultTable
				where PrintResultTable.RowNumber = @I + 1
			end
			
			if @rowcounter = 19 and @I > 21
			begin
				insert into #PrintResultTable (RowNumber, Description, DebtorAmount, CreditorAmount)	
				select @I+ @insertToRowNumber+ 1,
					N'‹-- منقول از صفحه قبل ',
					isnull(DebtorAmountُُSum, 0) DebtorAmount,
					isnull(CreditorAmountSum,0) CreditorAmount
				from ( 
					select sum(R.DebtorAmount) DebtorAmountُُSum,
						sum(R.CreditorAmount) CreditorAmountSum
					from #PrintResultTable R
					where R.RowNumber between @I+ @insertToRowNumber - 19 and @I+ @insertToRowNumber
					) SubQuery	
					
				update PrintResultTable
					set  RemainingAmount =(select RemainingAmount from #ResultTable where RowNumber = @I)
						, BalanceStatus	= (select BalanceStatus from #ResultTable where RowNumber = @I)	
				from #PrintResultTable PrintResultTable
				where PrintResultTable.RowNumber = @I+ @insertToRowNumber+ 1		
			end
			
			select @I = @I + 1
		end
	
	declare @PrintSqlQuery nvarchar(4000)
		set @PrintSqlQuery = 
			'select * 
			from #PrintResultTable 
			order by '+@SortExpression + ' ';

		exec (@PrintSqlQuery)
	end
	
	--apply paging:
	if @PrintMode = 0
	begin
		declare @PagingSqlQuery nvarchar(4000)
		set @PagingSqlQuery = '
			select top ' + cast(@MaxRecords as nvarchar) + ' *
			from (
				select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
				from (
					select * 
					from #ResultTable) NotPagedQuery
			) NotPagedQuery2
			where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
			'order by NotPagedQuery2._PagingRowNumber '

		exec (@PagingSqlQuery)
	end
end
go
 
afw.BeforeAlterSF 'acc.GetKolAccountID'
go
alter function acc.GetKolAccountID 
(
	@RefAccount uniqueidentifier
)
RETURNS uniqueidentifier
WITH RETURNS NULL ON NULL INPUT
AS
BEGIN
	declare @AccountLevel uniqueidentifier
	declare @KolAccount uniqueidentifier

	declare @AccountsLevelSet uniqueidentifier
	declare @KolLevel uniqueidentifier
	declare @MoinLevel uniqueidentifier
	declare @TafsiliLevel uniqueidentifier

	select @AccountsLevelSet = ID from afw_OptionSets where Name = 'AccountLevel'
	select @KolLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Kol'
	select @MoinLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Moin'
	select @TafsiliLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Tafsili'

	select @AccountLevel = AccountLevel From acc_Accounts Where ID = @RefAccount
	 	
	if @AccountLevel = @KolLevel begin select @KolAccount = @RefAccount	end

	if @AccountLevel = @MoinLevel 
	begin 
		select @KolAccount = ParentAccount From acc_Accounts Where ID = @RefAccount
	end

	if @AccountLevel = @TafsiliLevel 
	begin 
		select @KolAccount = ParentAccount From acc_Accounts Where ID = (select ParentAccount From acc_Accounts Where ID = @RefAccount)
	end	
	RETURN @KolAccount
end
go

afw.BeforeAlterSF 'acc.GetMoinAccountID'
go
alter function acc.GetMoinAccountID 
(
	@RefAccount uniqueidentifier
)
RETURNS uniqueidentifier
WITH RETURNS NULL ON NULL INPUT
AS
BEGIN
	declare @AccountLevel uniqueidentifier
	declare @MoinAccount uniqueidentifier

	declare @AccountsLevelSet uniqueidentifier
	declare @KolLevel uniqueidentifier
	declare @MoinLevel uniqueidentifier
	declare @TafsiliLevel uniqueidentifier

	select @AccountsLevelSet = ID from afw_OptionSets where Name = 'AccountLevel'
	select @KolLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Kol'
	select @MoinLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Moin'
	select @TafsiliLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelSet and Name = 'Tafsili'

	select @AccountLevel = AccountLevel From acc_Accounts Where ID = @RefAccount
	 	
	if @AccountLevel = @KolLevel begin select @MoinAccount = null end

	if @AccountLevel = @MoinLevel 
	begin 
		select @MoinAccount = @RefAccount
	end

	if @AccountLevel = @TafsiliLevel 
	begin 
		select @MoinAccount = ParentAccount From acc_Accounts Where ID = @RefAccount
	end	
	RETURN @MoinAccount
end
go

afw.BeforeAlterProc 'acc.GetCostAndBenefitReportData'
go
alter procedure acc.GetCostAndBenefitReportData
	@FinancialYear uniqueidentifier,
	@FromDate date,
	@ToDate date
as
begin 
	set fmtonly off--to prevent StimuleReport error in Retrieve Columns of Report DataSource when StoredProcedure contains Temp tables

	create table #ResultTable
	(
		AccountID uniqueidentifier, AccountCode nvarchar(50), AccountName nvarchar(200), 
		DebtorAmount decimal(38,2), CreditorAmount decimal(38,2),
		RemainingDebtorAmount decimal(38,2), RemainingCreditorAmount decimal(38,2)  
	) 

	insert into #ResultTable (AccountID, AccountCode, AccountName)
	select Account.ID, Account.FullCodeWithGroupCode, Account.FullName
	from acc_AccountsView Account
		inner join afw_OptionSetItems AccountNature on AccountNature.ID = Account.AccountNature
	where Account.AccountLevel_Name = 'Kol'
		and AccountNature.Name = 'CostAndBenefitCoding'
		and FinancialYear = @FinancialYear 
	order by Account.FullCode

	update ResultTable 
	set DebtorAmount = DocsAmountSum.DebtorAmountSum,
		CreditorAmount = DocsAmountSum.CreditorAmountSum
	from #ResultTable ResultTable 
		cross apply (
			select * 
			from acc.GetAccountAndChildsDocsAmountSum(
				ResultTable.AccountID, @FinancialYear, null, @FromDate, @ToDate)
			) DocsAmountSum

	--حذف حساب هایی که هیچ سندی ندارند
	delete #ResultTable where DebtorAmount is null or CreditorAmount is null

	update #ResultTable
	set RemainingDebtorAmount = 
			case when DebtorAmount - CreditorAmount > 0 then DebtorAmount - CreditorAmount
				else 0
			end,	
		RemainingCreditorAmount =
			case when CreditorAmount - DebtorAmount > 0 then CreditorAmount - DebtorAmount
				else 0
			end

	select * from #ResultTable
end   
go

afw.BeforeAlterProc 'acc.GenerateDafaterReportInfo'
go
alter procedure acc.GenerateDafaterReportInfo
	@FromDoc nvarchar(10),
	@ToDoc nvarchar(10), 
	@RefAccount uniqueidentifier,
	@FinancialYear uniqueidentifier 
as
set fmtonly off
begin
	
	declare @RemainingAmount decimal;
	declare @ID decimal;
	declare @DebtorAmount decimal;
	declare @CreditorAmount decimal;
	declare @CountRows decimal;
	declare @BalanceStatus nvarchar(8);
	
	select @DebtorAmount = 0;
	Select @CreditorAmount = 0;
	select @RemainingAmount = 0;
	Select @ID = 0;
	select @CountRows = 0;
	select @BalanceStatus = ''; 
	   
	declare @AccountLevel uniqueidentifier 
	declare @AccountsLevelOptionSetID uniqueidentifier
	declare @KolLevel uniqueidentifier
	declare @MoinLevel uniqueidentifier
	declare @TafsiliLevel uniqueidentifier
	 
	select @AccountsLevelOptionSetID = ID from afw_OptionSets where Name = 'AccountLevel'
	select @KolLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelOptionSetID and Name = 'Kol'
	select @MoinLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelOptionSetID and Name = 'Moin'
	select @TafsiliLevel = ID from afw_OptionSetItems where OptionSetID = @AccountsLevelOptionSetID and Name = 'Tafsili'
	select @AccountLevel = AccountLevel From acc_Accounts Where ID = @RefAccount

	if @AccountLevel is null
		select @AccountLevel = @KolLevel

	declare @DefaultGuid uniqueidentifier
	select @DefaultGuid = newid();
	 	 
	create table #TempDaftar
	(
		ID int, RefAccount uniqueidentifier, AccDoc uniqueidentifier, Account uniqueidentifier, DebtorAmount decimal(38,2), CreditorAmount decimal(38,2), IssueDate date,
		DocNo nvarchar(10), Description nvarchar(max), AccDocItem uniqueidentifier, RemainingAmount decimal(38,2), BalanceStatus nvarchar(8)  
	) 

	if @AccountLevel = @KolLevel  
	begin
		insert into #TempDaftar (ID, RefAccount, AccDoc, Account, DebtorAmount, CreditorAmount, IssueDate, DocNo, Description, AccDocItem, RemainingAmount, BalanceStatus)
		select row_number() over(order by Daftar.IssueDate, Daftar.DocNo, Daftar.DebtorAmountSum) ID, Daftar.KolAccount, Daftar.AccDoc, Daftar.Account,
        	Daftar.DebtorAmountSum, Daftar.CreditorAmountSum, Daftar.IssueDate, Daftar.DocNo, Daftar.Description, null AccDocItem, 0 RemainingAmount, '' BalanceStatus
        from
        	(select Temp.KolAccount, Temp.AccDoc, Temp.Account, sum(Temp.DebtorAmountSum) DebtorAmountSum, 0 CreditorAmountSum, AccDoc.IssueDate,
        	 	Temp.FinancialYear, AccDoc.DocNo, AccDoc.Description
        	 from (select tblTemp.KolAccount, tblTemp.AccDoc, tblTemp.Account, sum(tblTemp.DebtorAmount) DebtorAmountSum, tblTemp.FinancialYear
        	 	  from (select acc.GetKolAccountID(Account.ID) KolAccount, AccDocItem.AccDoc, AccDocItem.Account, AccDocItem.DebtorAmount, 
        	 		 	    AccDoc.FinancialYear
        	 		    from acc_Accounts Account  
        	 			    inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
        	 			    inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
        	 		    where (AccDocItem.CreditorAmount = 0) AND (AccDocItem.IsActive = 1)) tblTemp
        	 	  group by tblTemp.KolAccount, tblTemp.FinancialYear, tblTemp.AccDoc, tblTemp.Account) Temp
        	 	inner join acc_AccDocs AccDoc on AccDoc.ID = Temp.AccDoc
        	 	inner join afw_OptionSetItems AccDocStatus on AccDocStatus.ID = AccDoc.DocStatus
        	 where AccDocStatus.Name <> 'NotChecked' and AccDoc.IsActive = 1
        	 group by Temp.KolAccount, Temp.AccDoc, AccDoc.IssueDate, AccDoc.DocNo, AccDoc.Description, Temp.FinancialYear, Temp.Account
        	 union all
        	 select Temp.KolAccount, Temp.AccDoc, Temp.Account, 0 DebtorAmountSum, sum(Temp.CreditorAmountSum) CreditorAmountSum, AccDoc.IssueDate,
        	 	Temp.FinancialYear, AccDoc.DocNo, AccDoc.Description
        	 from (select tblTemp.KolAccount, tblTemp.AccDoc, tblTemp.Account, sum(tblTemp.CreditorAmount) CreditorAmountSum, tblTemp.FinancialYear
        	 	  from (select acc.GetKolAccountID(Account.ID) KolAccount, AccDocItem.AccDoc, AccDocItem.Account, AccDocItem.CreditorAmount, 
        	 		 	    AccDoc.FinancialYear
        	 		    from acc_Accounts Account  
        	 			    inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
        	 			    inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
        	 		    where (AccDocItem.DebtorAmount = 0) AND (AccDocItem.IsActive = 1)) tblTemp
        	 	  group by tblTemp.KolAccount, tblTemp.FinancialYear, tblTemp.AccDoc, tblTemp.Account) Temp
        	 	inner join acc_AccDocs AccDoc on AccDoc.ID = Temp.AccDoc
        	 	inner join afw_OptionSetItems AccDocStatus on AccDocStatus.ID = AccDoc.DocStatus
        	 where AccDocStatus.Name <> 'NotChecked' and AccDoc.IsActive = 1
        	 group by Temp.KolAccount, Temp.AccDoc, AccDoc.IssueDate, AccDoc.DocNo, AccDoc.Description, Temp.FinancialYear, Temp.Account) Daftar
        where isnull(Daftar.DocNo, -1) >= isnull(isnull(@FromDoc, Daftar.DocNo), -1)
			and isnull(Daftar.DocNo, -1) >= isnull(isnull(@ToDoc, Daftar.DocNo), -1) 
			and isnull(Daftar.KolAccount, @DefaultGuid) = isnull(isnull(@RefAccount , Daftar.KolAccount), @DefaultGuid) 
        	and Daftar.FinancialYear = @FinancialYear
        order by Daftar.IssueDate, Daftar.DocNo

		select @CountRows = count(ID) from #TempDaftar
		
		while @ID <= @CountRows
		begin
			select @DebtorAmount = DebtorAmount , @CreditorAmount = CreditorAmount From #TempDaftar Where ID = @ID
			select @RemainingAmount = @DebtorAmount - @CreditorAmount + @RemainingAmount 
			if @RemainingAmount < 0 begin select @BalanceStatus = N'بستانکار' end
			if @RemainingAmount > 0 begin select @BalanceStatus = N'بدهکار' end
			if @RemainingAmount = 0 begin select @BalanceStatus = N'بی حساب' end 
			update #TempDaftar set RemainingAmount = @RemainingAmount , BalanceStatus = @BalanceStatus Where ID = @ID
			select @ID = @ID + 1 
		end
		Update #TempDaftar Set RemainingAmount = RemainingAmount * -1 Where RemainingAmount < 0

		select #TempDaftar.ID, #TempDaftar.DebtorAmount, #TempDaftar.CreditorAmount, afw.GregorianToPersian(#TempDaftar.IssueDate) IssueDate,
			#TempDaftar.DocNo, #TempDaftar.Description, #TempDaftar.RemainingAmount, #TempDaftar.BalanceStatus, #TempDaftar.AccDoc, Account.Name AccountName
		from #TempDaftar
			inner join acc_Accounts Account on Account.ID =  #TempDaftar.RefAccount
	end
	else if @AccountLevel = @MoinLevel
	begin
		insert into #TempDaftar (ID, RefAccount, AccDoc, Account, DebtorAmount, CreditorAmount, IssueDate, DocNo, Description, AccDocItem, RemainingAmount, BalanceStatus)
		select row_number() over(order by Daftar.IssueDate, Daftar.DocNo, Daftar.DebtorAmountSum) ID, Daftar.MoinAccount, Daftar.AccDoc, Daftar.Account,
        	Daftar.DebtorAmountSum, Daftar.CreditorAmountSum, Daftar.IssueDate, Daftar.DocNo, Daftar.Description, null AccDocItem, 0 RemainingAmount, '' BalanceStatus
        from
        	(select Temp.MoinAccount, Temp.AccDoc, Temp.Account, sum(Temp.DebtorAmountSum) DebtorAmountSum, 0 CreditorAmountSum, AccDoc.IssueDate,
        	 	Temp.FinancialYear, AccDoc.DocNo, AccDoc.Description
        	 from (select tblTemp.MoinAccount, tblTemp.AccDoc, tblTemp.Account, sum(tblTemp.DebtorAmount) DebtorAmountSum, tblTemp.FinancialYear
        	 	  from (select acc.GetMoinAccountID(Account.ID) MoinAccount, AccDocItem.AccDoc, AccDocItem.Account, AccDocItem.DebtorAmount, 
        	 		 	    AccDoc.FinancialYear
        	 		    from acc_Accounts Account  
        	 			    inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
        	 			    inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
        	 		    where (AccDocItem.CreditorAmount = 0) AND (AccDocItem.IsActive = 1)) tblTemp
        	 	  group by tblTemp.MoinAccount, tblTemp.FinancialYear, tblTemp.AccDoc, tblTemp.Account) Temp
        	 	inner join acc_AccDocs AccDoc on AccDoc.ID = Temp.AccDoc
        	 	inner join afw_OptionSetItems AccDocStatus on AccDocStatus.ID = AccDoc.DocStatus
        	 where AccDocStatus.Name <> 'NotChecked' and AccDoc.IsActive = 1
        	 group by Temp.MoinAccount, Temp.AccDoc, AccDoc.IssueDate, AccDoc.DocNo, AccDoc.Description, Temp.FinancialYear, Temp.Account
        	 union all
        	 select Temp.MoinAccount, Temp.AccDoc, Temp.Account, 0 DebtorAmountSum, sum(Temp.CreditorAmountSum) CreditorAmountSum, AccDoc.IssueDate,
        	 	Temp.FinancialYear, AccDoc.DocNo, AccDoc.Description
        	 from (select tblTemp.MoinAccount, tblTemp.AccDoc, tblTemp.Account, sum(tblTemp.CreditorAmount) CreditorAmountSum, tblTemp.FinancialYear
        	 	  from (select acc.GetMoinAccountID(Account.ID) MoinAccount, AccDocItem.AccDoc, AccDocItem.Account, AccDocItem.CreditorAmount, 
        	 		 	    AccDoc.FinancialYear
        	 		    from acc_Accounts Account  
        	 			    inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
        	 			    inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
        	 		    where (AccDocItem.DebtorAmount = 0) AND (AccDocItem.IsActive = 1)) tblTemp
        	 	  group by tblTemp.MoinAccount, tblTemp.FinancialYear, tblTemp.AccDoc, tblTemp.Account) Temp
        	 	inner join acc_AccDocs AccDoc on AccDoc.ID = Temp.AccDoc
        	 	inner join afw_OptionSetItems AccDocStatus on AccDocStatus.ID = AccDoc.DocStatus
        	 where AccDocStatus.Name <> 'NotChecked' and AccDoc.IsActive = 1
        	 group by Temp.MoinAccount, Temp.AccDoc, AccDoc.IssueDate, AccDoc.DocNo, AccDoc.Description, Temp.FinancialYear, Temp.Account) Daftar
        where isnull(Daftar.DocNo, -1) >= isnull(isnull(@FromDoc, Daftar.DocNo), -1)
			and isnull(Daftar.DocNo, -1) >= isnull(isnull(@ToDoc, Daftar.DocNo), -1) 
			and isnull(Daftar.MoinAccount, @DefaultGuid) = isnull(isnull(@RefAccount , Daftar.MoinAccount), @DefaultGuid) 
        	and Daftar.FinancialYear = @FinancialYear
        order by Daftar.IssueDate, Daftar.DocNo

		select @CountRows = count(ID) from #TempDaftar
		
		while @ID <= @CountRows
		begin
			select @DebtorAmount = DebtorAmount , @CreditorAmount = CreditorAmount From #TempDaftar Where ID = @ID
			select @RemainingAmount = @DebtorAmount - @CreditorAmount + @RemainingAmount 
			if @RemainingAmount < 0 begin select @BalanceStatus = N'بستانکار' end
			if @RemainingAmount > 0 begin select @BalanceStatus = N'بدهکار' end
			if @RemainingAmount = 0 begin select @BalanceStatus = N'بی حساب' end 
			update #TempDaftar set RemainingAmount = @RemainingAmount , BalanceStatus = @BalanceStatus Where ID = @ID
			select @ID = @ID + 1 
		end
		Update #TempDaftar Set RemainingAmount = RemainingAmount * -1 Where RemainingAmount < 0

		select #TempDaftar.ID, #TempDaftar.DebtorAmount, #TempDaftar.CreditorAmount, afw.GregorianToPersian(#TempDaftar.IssueDate) IssueDate,
			#TempDaftar.DocNo, #TempDaftar.Description, #TempDaftar.RemainingAmount, #TempDaftar.BalanceStatus, #TempDaftar.AccDoc, Account.Name AccountName
		from #TempDaftar
			inner join acc_Accounts Account on Account.ID =  #TempDaftar.RefAccount
	end
	else if @AccountLevel = @TafsiliLevel
	begin 
		insert into #TempDaftar (ID, RefAccount, AccDoc, Account, DebtorAmount, CreditorAmount, IssueDate, DocNo, Description, AccDocItem, RemainingAmount, BalanceStatus)
		select row_number() over(order by Daftar.IssueDate, Daftar.DocNo, Daftar.CreditorAmount) ID, Daftar.TafsiliAccount, Daftar.AccDoc, Daftar.Account,
        	Daftar.DebtorAmount, Daftar.CreditorAmount, Daftar.IssueDate, Daftar.DocNo, Daftar.ItemDescription, null AccDocItem, 0 RemainingAmount, '' BalanceStatus
		from (select Temp.TafsiliAccount, Temp.AccDoc, Temp.Account, Temp.DebtorAmount, Temp.CreditorAmount, AccDoc.IssueDate, AccDoc.DocNo,
			  	Temp.ItemDescription, Temp.AccDocItem, Temp.FinancialYear
			  from (select Account.ID TafsiliAccount, AccDocItem.AccDoc, AccDocItem.Account, AccDocItem.DebtorAmount, 0 CreditorAmount, 
			  	  	    AccDocItem.Note ItemDescription, AccDocItem.ID AccDocItem, AccDoc.FinancialYear
			  	    from acc_Accounts Account  
			  	        inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
			  	        inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
			  	    where (AccDocItem.CreditorAmount = 0) AND (AccDocItem.IsActive = 1)
			  	    union all
			  	    select Account.ID TafsiliAccount, AccDocItem.AccDoc, AccDocItem.Account, 0 DebtorAmount, AccDocItem.CreditorAmount, 
			  	  	    AccDocItem.Note ItemDescription, AccDocItem.ID AccDocItem, AccDoc.FinancialYear
			  	    from acc_Accounts Account  
			  	        inner join acc_AccDocItems AccDocItem on AccDocItem.Account = Account.ID 
			  	        inner join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
			  	    where (AccDocItem.DebtorAmount = 0) and (AccDocItem.IsActive = 1)) Temp
			  			inner join acc_AccDocs AccDoc on AccDoc.ID = Temp.AccDoc 
			  			inner join afw_OptionSetItems AccDocStatus on AccDocStatus.ID = AccDoc.DocStatus
			  where AccDocStatus.Name <> 'NotChecked' and AccDoc.IsActive = 1
			) Daftar
		where isnull(Daftar.DocNo, -1) >= isnull(isnull(@FromDoc, Daftar.DocNo), -1)
					and isnull(Daftar.DocNo, -1) >= isnull(isnull(@ToDoc, Daftar.DocNo), -1) 
					and isnull(Daftar.TafsiliAccount, @DefaultGuid) = isnull(isnull(@RefAccount , Daftar.TafsiliAccount), @DefaultGuid) 
		        	and Daftar.FinancialYear = @FinancialYear
		order by Daftar.IssueDate, Daftar.DocNo

		select @CountRows = count(ID) from #TempDaftar
		
		while @ID <= @CountRows
		begin
			select @DebtorAmount = DebtorAmount, @CreditorAmount = CreditorAmount From #TempDaftar Where ID = @ID
			select @RemainingAmount = @DebtorAmount - @CreditorAmount + @RemainingAmount 
			if @RemainingAmount < 0 begin select @BalanceStatus = N'بستانکار' end
			if @RemainingAmount > 0 begin select @BalanceStatus = N'بدهکار' end
			if @RemainingAmount = 0 begin select @BalanceStatus = N'بی حساب' end 
			update #TempDaftar set RemainingAmount = @RemainingAmount , BalanceStatus = @BalanceStatus Where ID = @ID
			select @ID = @ID + 1 
		end
		Update #TempDaftar Set RemainingAmount = RemainingAmount * -1 Where RemainingAmount < 0

		select #TempDaftar.ID, #TempDaftar.DebtorAmount, #TempDaftar.CreditorAmount, afw.GregorianToPersian(#TempDaftar.IssueDate) IssueDate,
			#TempDaftar.DocNo, #TempDaftar.Description, #TempDaftar.RemainingAmount, #TempDaftar.BalanceStatus, #TempDaftar.AccDoc, Account.Name AccountName
		from #TempDaftar
			inner join acc_Accounts Account on Account.ID =  #TempDaftar.RefAccount
	end 
end
go

afw.BeforeAlterProc 'acc.AccDocOficcialWithDetailAndFloatPrint'
go
alter procedure [acc].[AccDocOficcialWithDetailAndFloatPrint]
	@FromDocReferenceNo bigint,
	@ToDocReferenceNo bigint, 
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier
as 
begin  
	select AccDoc.DocNo, AccountView.FullCode AllCode, TempAccDoc.AccDoc, TempAccDoc.ParentAccount, TempAccDoc.Account,
		TempAccDoc.DetailAmount, TempAccDoc.DebtorAmount, TempAccDoc.CreditorAmount, TempAccDoc.SubMaster, TempAccDoc.subDetail, TempAccDoc.Note,
		AccDoc.Description DocDescription, afw.GregorianToPersian(AccDoc.IssueDate) IssueDate,
		AccountView.FullName + 
		case when CustomerName <> '' then N' - اشخاص: ' + CustomerName else '' end + 
		case when CostCenterName <> '' then N' - مرکزهزینه: ' + CostCenterName else '' end +
		case when ProjectName <> '' then N' - پروژه: ' + ProjectName else '' end +
		case when ForeignCurrencyName <> '' then N' - ارزی: ' + ForeignCurrencyName else '' end AllName
	from (   
		/*Detail Debtor*/
		select DocItem.AccDoc, Account.ParentAccount, Account.ID Account, DebtorAmount DetailAmount, 0 DebtorAmount, 0 CreditorAmount, 1 SubMaster, 1 subDetail,
		DocItem.Note, isnull(Customer.FullName , '') CustomerName, isnull(CostCenter.Name , '') CostCenterName, isnull(Project.Name , '') ProjectName,
		isnull(ForeignCurrency.Name , '') ForeignCurrencyName
		from acc_AccDocItems DocItem
			inner join acc_AccountsView Account on Account.ID = DocItem.Account 
			left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
			left join cmn_PersonsLookUpView Customer on Customer.ID = DocItem.Person  
			left join cmn_CostCenters CostCenter on CostCenter.ID = DocItem.CostCenter  
			left join cmn_Projects Project on Project.ID = DocItem.Project
			left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ID = DocItem.ForeignCurrency
		Where Account.ParentAccount is not null 
			and DocItem.CreditorAmount = 0 
			and Doc.FinancialYear = @FinancialYear 
			and Doc.FinancialDocType = @FinancialDocType
			and Doc.DocNo >= @FromDocReferenceNo 
			and Doc.DocNo <= @ToDocReferenceNo 
			and DocItem.IsActive = 1 
			and Doc.IsActive = 1 		
		union		
		/*Detail Creditor*/
		select DocItem.AccDoc, Account.ParentAccount, Account.ID Account, CreditorAmount DetailAmount, 0 DebtorAmount, 0 CreditorAmount, 2 SubMaster, 1 subDetail,
		DocItem.Note, isnull(Customer.FullName , '') CustomerName, isnull(CostCenter.Name , '') CostCenterName, isnull(Project.Name , '') ProjectName,
		isnull(ForeignCurrency.Name , '') ForeignCurrencyName
		from acc_AccDocItems DocItem
			inner join acc_AccountsView Account on Account.ID = DocItem.Account 
			left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
			left join cmn_PersonsLookUpView Customer on Customer.ID = DocItem.Person  
			left join cmn_CostCenters CostCenter on CostCenter.ID = DocItem.CostCenter  
			left join cmn_Projects Project on Project.ID = DocItem.Project
			left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ID = DocItem.ForeignCurrency
		Where Account.ParentAccount is not null 
			and DocItem.DebtorAmount = 0 
			and Doc.FinancialYear = @FinancialYear 
			and Doc.FinancialDocType = @FinancialDocType
			and Doc.DocNo >= @FromDocReferenceNo 
			and Doc.DocNo <= @ToDocReferenceNo 
			and DocItem.IsActive = 1 
			and Doc.IsActive = 1 		
		union 			
		/* Sum Debtor*/
		select TempBed.AccDoc, TempBed.ParentAccount, TempBed.Account, TempBed.DetailAmount, TempBed.DebtorAmount, TempBed.CreditorAmount, 
			TempBed.SubMaster, TempBed.subDetail, TempBed.note, TempBed.CustomerName, TempBed.CostCenterName, TempBed.ProjectName, TempBed.ForeignCurrencyName
			from (
				select DocItem.AccDoc, Account.ParentAccount, Account.ParentAccount Account, 0 DetailAmount, sum(DebtorAmount) DebtorAmount, 0 CreditorAmount,
					1 SubMaster, 0 subDetail, '' Note, '' CustomerName, '' CostCenterName, '' ProjectName, '' ForeignCurrencyName
				from acc_AccDocItems DocItem 
					inner join acc_Accounts Account on Account.ID = DocItem.Account
					left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
				Where Account.ParentAccount is not null 
					and DocItem.CreditorAmount = 0 
					and Doc.FinancialYear = @FinancialYear 
					and Doc.FinancialDocType = @FinancialDocType
					and Doc.DocNo >= @FromDocReferenceNo 
					and Doc.DocNo <= @ToDocReferenceNo
				Group by Account.ParentAccount, DocItem.AccDoc
			) as TempBed
				left join acc_Accounts Account on TempBed.Account = Account.ID			
		union			
		/* Sum Debtor Master*/ 
		select DocItem.AccDoc, Account.ID Account, Account.ID Account, 0 DetailAmount, sum(DebtorAmount) DebtorAmount, 0 CreditorAmount,
			1 SubMaster, 0 subDetail, '' Note, '' CustomerName, '' CostCenterName, '' ProjectName, '' ForeignCurrencyName
		from acc_AccDocItems DocItem 
			inner join acc_Accounts Account on Account.ID = DocItem.Account
			left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
		Where Account.ParentAccount is null 
			and DocItem.CreditorAmount = 0 
			and Doc.FinancialYear = @FinancialYear 
			and Doc.FinancialDocType = @FinancialDocType
			and Doc.DocNo >= @FromDocReferenceNo 
			and Doc.DocNo <= @ToDocReferenceNo
		Group by Account.ID, DocItem.AccDoc
		
		union
		
		/* Sum Creditor*/
		select TempBes.AccDoc, TempBes.ParentAccount, TempBes.Account, TempBes.DetailAmount, TempBes.DebtorAmount, TempBes.CreditorAmount, 
			TempBes.SubMaster, TempBes.subDetail, TempBes.note, TempBes.CustomerName, TempBes.CostCenterName, TempBes.ProjectName, TempBes.ForeignCurrencyName
			from (
				select DocItem.AccDoc, Account.ParentAccount, Account.ParentAccount Account, 0 DetailAmount, 0 DebtorAmount, sum(CreditorAmount) CreditorAmount,
					2 SubMaster, 0 subDetail, '' Note, '' CustomerName, '' CostCenterName, '' ProjectName, '' ForeignCurrencyName
				from acc_AccDocItems DocItem 
					inner join acc_Accounts Account on Account.ID = DocItem.Account
					left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
				Where Account.ParentAccount is not null 
					and DocItem.DebtorAmount = 0 
					and Doc.FinancialYear = @FinancialYear 
					and Doc.FinancialDocType = @FinancialDocType
					and Doc.DocNo >= @FromDocReferenceNo 
					and Doc.DocNo <= @ToDocReferenceNo
				Group by Account.ParentAccount, DocItem.AccDoc
			) as TempBes
				left join acc_Accounts Account on TempBes.Account = Account.ID
		
		union
		
		/* Sum Creditor Master*/ 
		select DocItem.AccDoc, Account.ID Account, Account.ID Account, 0 DetailAmount, 0 DebtorAmount, sum(CreditorAmount) CreditorAmount,
			2 SubMaster, 0 subDetail, '' Note, '' CustomerName, '' CostCenterName, '' ProjectName, '' ForeignCurrencyName 
		from acc_AccDocItems DocItem 
			inner join acc_Accounts Account on Account.ID = DocItem.Account
			left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
		Where Account.ParentAccount is null 
			and DocItem.DebtorAmount = 0 
			and Doc.FinancialYear = @FinancialYear 
			and Doc.FinancialDocType = @FinancialDocType
			and Doc.DocNo >= @FromDocReferenceNo 
			and Doc.DocNo <= @ToDocReferenceNo
		Group by Account.ID, DocItem.AccDoc 
		) TempAccDoc 
		left join acc_AccDocs AccDoc on AccDoc.ID = TempAccDoc.AccDoc
		left join acc_AccountsView AccountView on AccountView.ID = TempAccDoc.Account
	where AccDoc.FinancialYear = @FinancialYear 
		and FinancialDocType = @FinancialDocType
		and DocNo >= @FromDocReferenceNo 
		and DocNo <= @ToDocReferenceNo
	order by DocNo, SubMaster, ParentAccount, subDetail
end
go

afw.BeforeAlterProc 'acc.GetAccDocs'
go
alter procedure acc.GetAccDocs 
	-- Add the parameters for the stored procedure here
	@FromDate date,
	@ToDate date, 
	@FinancialYear uniqueidentifier,
	@AccDocType nvarchar(20)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
    if @AccDocType = 'MandehDar'
    begin
		select AccDocs.ID, 
			AccDocs.DocNo, 
			afw.GregorianToPersian(AccDocs.IssueDate) IssueDate, 
			AccDocs.Description
		from acc_AccDocs AccDocs 
			inner join acc_AccDocItems AccDocItems on AccDocs.ID = AccDocItems.AccDoc
		where cast(AccDocs.IssueDate as date) >=  @FromDate and cast(AccDocs.IssueDate as date) <= @ToDate
		group by AccDocs.ID,
			AccDocs.DocNo, 
			AccDocs.IssueDate, 
			AccDocs.Description
		having sum(AccDocItems.DebtorAmount) - SUM(AccDocItems.CreditorAmount) != 0
    end
    else if @AccDocType = 'Draft'
    begin
		select  AccDocs.ID, 
			AccDocs.DocNo, 
			afw.GregorianToPersian(AccDocs.IssueDate) IssueDate, 
			AccDocs.Description
		from acc_AccDocs AccDocs  
			inner join afw_OptionSetItems OptionSetItems ON OptionSetItems.id = AccDocs.DocStatus
		where cast(AccDocs.IssueDate as date) >=  @FromDate and cast(AccDocs.IssueDate as date) <= @ToDate and 
			OptionSetItems.Name = @AccDocType
	end
	else if @AccDocType = 'InActiveArticle'
	begin
		select  AccDocs.ID, 
			AccDocs.DocNo, 
			afw.GregorianToPersian(AccDocs.IssueDate) IssueDate, 
			AccDocs.Description
		from acc_AccDocs AccDocs 
		inner join acc_AccDocItems AccDocItems on AccDocs.ID = AccDocItems.AccDoc
		where AccDocItems.IsActive = 0
	end
	else 
	begin
		select  AccDocs.ID, AccDocs.DocNo, afw.GregorianToPersian(AccDocs.IssueDate) IssueDate, AccDocs.Description
		from acc_AccDocs AccDocs
	end
END
go

afw.BeforeAlterProc 'acc.AccDocOficcialWithFloatPrint'
go
alter procedure acc.AccDocOficcialWithFloatPrint
	@FromDocReferenceNo bigint,
	@ToDocReferenceNo bigint, 
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier
as 
begin  
	select AccDoc.ID, AccDoc.DocNo, AccountView.FullCode AllCode, TempAccDoc.AccDoc, TempAccDoc.ParentAccount, TempAccDoc.Account,
		TempAccDoc.DebtorAmount, TempAccDoc.CreditorAmount, TempAccDoc.SubMaster, TempAccDoc.subDetail, TempAccDoc.Note,
		AccDoc.Description DocDescription, CustomerName, CostCenterName, ProjectName, ForeignCurrencyName, RowNo, afw.GregorianToPersian(AccDoc.IssueDate) IssueDate,
		AccountView.FullName + 
		case when CustomerName <> '' then N' - اشخاص: ' + CustomerName else '' END + 
		case when CostCenterName <> '' then N' - مرکزهزینه: ' + CostCenterName else '' END +
		case when ProjectName <> '' then N' - پروژه: ' + ProjectName else '' END +
		case when ForeignCurrencyName <> '' then N' - ارزی: ' + ForeignCurrencyName else '' END AllName
	from (   
			/*Detail Debtor*/
			select DocItem.AccDoc, AccountView.ParentAccount, AccountView.ID Account, DebtorAmount, 0 CreditorAmount, 1 SubMaster, 1 subDetail, 
			DocItem.Note, isnull(Customer.FullName , '') CustomerName, isnull(CostCenter.Name , '') CostCenterName, isnull(Project.Name , '') ProjectName, 
			isnull(ForeignCurrency.Name , '') ForeignCurrencyName, DocItem.RowNo 
			from acc_AccDocItems DocItem
				inner join acc_AccountsView AccountView on AccountView.ID = DocItem.Account 
				left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
				left join cmn_PersonsLookUpView Customer on Customer.ID = DocItem.Person  
				left join cmn_CostCenters CostCenter on CostCenter.ID = DocItem.CostCenter  
				left join cmn_Projects Project on Project.ID = DocItem.Project
				left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ID = DocItem.ForeignCurrency
			Where AccountView.ParentAccount is not null 
				and DocItem.CreditorAmount = 0 
				and Doc.FinancialYear = @FinancialYear 
				and FinancialDocType = @FinancialDocType
				and Doc.DocNo >= @FromDocReferenceNo 
				and Doc.DocNo <= @ToDocReferenceNo
			
			union
			
			/*Detail Creditor*/
			select DocItem.AccDoc, AccountView.ParentAccount, AccountView.ID Account, 0 DebtorAmount, CreditorAmount CreditorAmount, 2 SubMaster, 1 subDetail, 
			DocItem.Note, isnull(Customer.FullName , '') CustomerName, isnull(CostCenter.Name , '') CostCenterName, isnull(Project.Name , '') ProjectName, 
			isnull(ForeignCurrency.Name , '') ForeignCurrencyName, DocItem.RowNo 
			from acc_AccDocItems DocItem
				inner join acc_AccountsView AccountView on AccountView.ID = DocItem.Account 
				left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc 
				left join cmn_PersonsLookUpView Customer on Customer.ID = DocItem.Person  
				left join cmn_CostCenters CostCenter on CostCenter.ID = DocItem.CostCenter  
				left join cmn_Projects Project on Project.ID = DocItem.Project
				left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ID = DocItem.ForeignCurrency
			Where AccountView.ParentAccount is not null 
				and DocItem.DebtorAmount = 0 
				and Doc.FinancialYear = @FinancialYear 
				and FinancialDocType = @FinancialDocType
				and Doc.DocNo >= @FromDocReferenceNo 
				and Doc.DocNo <= @ToDocReferenceNo	  
			) TempAccDoc 
		inner join acc_AccDocs AccDoc on AccDoc.ID = TempAccDoc.AccDoc
		inner join acc_AccountsView AccountView on AccountView.ID = TempAccDoc.Account
	order by RowNo, SubMaster, ParentAccount, subDetail
end
go

afw.BeforeAlterProc 'acc.GenerateAccountReview'
go

alter procedure acc.GenerateAccountReview
	@NoeTaraz nvarchar(20), --'AllCoding', 'BalanceSheetCoding', 'CostAndBenefitCoding' 
	@FromDate date,
	@ToDate date,
	@FromDocReferenceNo int,
	@ToDocReferenceNo int, 
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier,
	@OrganizationUnit uniqueidentifier,
	@AccountReviewType nvarchar(30),--AccountGroup, Kol, Moin, Tafsili, Person, CostCenter, Project
	@ParentAccountGroup uniqueidentifier,
	@ParentAccount uniqueidentifier,
	@ShenavarGroupID uniqueidentifier,
	@RemainedStatusFilter nvarchar(50),
	@FilterExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@StartRecordNumber int,
	@MaxRecords int
as
set fmtonly off
begin 
	set nocount on;
	
	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @SortExpression is null set @SortExpression = N'RowNumber'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000

	create table #AccountReviewTempTable (
		RowNumber int identity(1,1), 
		AccountReviewItemID uniqueidentifier,
		RefAccountReviewItemID uniqueidentifier, 
		RefItemName nvarchar(100), 
		RefItemCode nvarchar(50),
		AccountType_Name nvarchar(30),
		AccountType_Text nvarchar(30), 
		Name nvarchar(100), 
		Code nvarchar(50),
		AccountLevel uniqueidentifier,
		AccountGroup uniqueidentifier, 
		DebtorAmount decimal(38,2), 
		CreditorAmount decimal(38,2),
		RemainingDebtorAmount decimal(38,2), 
		RemainingCreditorAmount decimal(38,2),
		TotalRecordsCount int,
		DebtorAmountSum money,
		CreditorAmountSum money)
	
	declare @KolLevelID uniqueidentifier
	declare @MoinLevelID uniqueidentifier
	declare @TafsiliLevelID uniqueidentifier
	declare @AccountsNatureOptionSetID uniqueidentifier
	declare @CostAndBenefitCodingID uniqueidentifier
	declare @BalanceSheetCodingID uniqueidentifier
	declare @Neutral uniqueidentifier
	declare @AccountType_Name varchar(50)--احتمالا این متغیر و فیلد مربوطه باید حذف شود. زیرا پارامتر 'نحوه مرور حساب' کافی است
	declare @ShanavarFieldName varchar(30)
	declare @DocStatusNotChecked uniqueidentifier --اسناد تنظیم نشده در مرور حساب نیاید
	
	select @KolLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Kol'
	select @MoinLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Moin'
	select @TafsiliLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Tafsili'

	select @DocStatusNotChecked = ID from afw_OptionSetItemsView where FullName = 'acc.DocStatus.NotChecked'

	select @AccountsNatureOptionSetID = ID from afw_OptionSets where Name = 'AccountNature'
	select @CostAndBenefitCodingID = ID from afw_OptionSetItems where OptionSetID = @AccountsNatureOptionSetID and Name = 'CostAndBenefitCoding'
	select @BalanceSheetCodingID = ID from afw_OptionSetItems where OptionSetID = @AccountsNatureOptionSetID and Name = 'BalanceSheetCoding'
	select @Neutral = ID from afw_OptionSetItems where OptionSetID = @AccountsNatureOptionSetID and Name = 'Neutral'
	
	select *
	into #AccountsView
	from acc_AccountsView
	
	--return
	
	if @AccountReviewType = 'AccountGroup'
	begin
		set @AccountType_Name = 'AccountGroup'
	
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Code, Name)
		select AccountGroup.ID, 'AccountGroup', N'گروه حساب', AccountGroup.GroupCode, AccountGroup.Title
		from acc_AccountGroups AccountGroup
	end
	else if @AccountReviewType = 'Kol'
	begin
		set @AccountType_Name = 'Account_Kol'
	
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, 
			Code, Name, AccountGroup, AccountLevel)
		select Kol.ID ,'Account_Kol', N'حساب کل', Kol.FullCode, Kol.FullName, Kol.AccountGroup, Kol.AccountLevel
		from acc_AccountsView Kol
		where AccountLevel = @KolLevelID
			and (@FinancialYear is null or FinancialYear = @FinancialYear )
			and (@ParentAccountGroup is null or Kol.AccountGroup = @ParentAccountGroup)
			and (
				@NoeTaraz = 'AllCoding'
				or (@NoeTaraz = 'BalanceSheetCoding' and Kol.AccountNature = @BalanceSheetCodingID)
				or (@NoeTaraz = 'CostAndBenefitCoding' and Kol.AccountNature = @CostAndBenefitCodingID)
				)
	end
	else if @AccountReviewType = 'Moin'
	begin 
		set @AccountType_Name = 'Account_Moin'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, 
			Code, Name, AccountGroup, AccountLevel)
		select Moin.ID ,'Account_Moin', N'حساب معین',
			case 
				when @ParentAccount is null then Moin.FullCode
				else Moin.Code
			end Code, 
			case 
				when @ParentAccount is null then Moin.FullName
				else Moin.Name
			end Name, 
			Kol.AccountGroup, Moin.AccountLevel
		from acc_AccountsView Moin
			inner join acc_Accounts Kol on Kol.ID = Moin.KolID
		where Moin.AccountLevel = @MoinLevelID
			and (@FinancialYear is null or Moin.FinancialYear = @FinancialYear)
			and (@ParentAccount is null or Moin.ParentAccount = @ParentAccount) 
			and (@ParentAccountGroup is null or Moin.AccountGroup = @ParentAccountGroup)
			and (
				@NoeTaraz = 'AllCoding'
				or (@NoeTaraz = 'BalanceSheetCoding' and Kol.AccountNature = @BalanceSheetCodingID)
				or (@NoeTaraz = 'CostAndBenefitCoding' and Kol.AccountNature = @CostAndBenefitCodingID)
				)
	end
    else if @AccountReviewType = 'Tafsili'
	begin
		set @AccountType_Name = 'Account_Tafsili'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Code, Name, 
			AccountGroup, AccountLevel)
		select Tafsili.ID, 'Account_Tafsili', N'حساب تفصیلی', 
			case 
				when @ParentAccount is null then Tafsili.FullCode
				else Tafsili.Code
			end Code, 
			case 
				when @ParentAccount is null then Tafsili.FullName
				else Tafsili.Name
			end Name,
			Kol.AccountGroup, Tafsili.AccountLevel
		from acc_AccountsView Tafsili
			inner join acc_Accounts Kol on Kol.ID = Tafsili.KolID
		where Tafsili.AccountLevel = @TafsiliLevelID
			and (@FinancialYear is null or Tafsili.FinancialYear = @FinancialYear )
			and (@ParentAccount is null or Tafsili.ParentAccount = @ParentAccount)
			and (@ParentAccountGroup is null or Tafsili.AccountGroup = @ParentAccountGroup)
			and (
				@NoeTaraz = 'AllCoding'
				or (@NoeTaraz = 'BalanceSheetCoding' and Kol.AccountNature = @BalanceSheetCodingID)
				or (@NoeTaraz = 'CostAndBenefitCoding' and Kol.AccountNature = @CostAndBenefitCodingID)
				)
	end
	else if @AccountReviewType = 'Person'
	begin
		set @ShanavarFieldName = 'Person'
		set @AccountType_Name = 'Shenavar_Person'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Name, Code)
		select distinct AccDocItem.Person, 'Shenavar_Person', N'اشخاص', Person.FullName, Person.FinancialAccountCode
		from acc_AccDocItems AccDocItem
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts Account on Account.ID = AccDocItem.Account
			left join acc_Accounts ParentAccount1 on ParentAccount1.ID = Account.ParentAccount
			left join cmn_PersonsView Person on Person.ID = AccDocItem.Person
			left join cmn_PersonGroupRelations PersonGroupRelation on PersonGroupRelation.Person = person.ID
		where AccDoc.DocStatus <> @DocStatusNotChecked
			and (@FinancialYear is null or Account.FinancialYear = @FinancialYear )
			and AccDocItem.Person is not null
			and (@ParentAccount is null 
				or (
					Account.ID = @ParentAccount
					or (Account.ParentAccount is not null and Account.ParentAccount = @ParentAccount)
					or (ParentAccount1.ParentAccount is not null and ParentAccount1.ParentAccount = @ParentAccount)
				)
			)
			and (@ShenavarGroupID is null or PersonGroupRelation.PersonGroup = @ShenavarGroupID)
			
	end
	else if @AccountReviewType = 'CostCenter'
	begin
		set @ShanavarFieldName = 'CostCenter'
		set @AccountType_Name = 'Shenavar_CostCenter'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Name)
		select distinct AccDocItem.CostCenter,'Shenavar_CostCenter', N'مراکز هزینه', CostCenter.Name
		from acc_AccDocItems AccDocItem
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts Account on Account.ID = AccDocItem.Account
			left join acc_Accounts ParentAccount1 on ParentAccount1.ID = Account.ParentAccount
			left join cmn_CostCenters CostCenter on CostCenter.ID = AccDocItem.CostCenter
		where AccDoc.DocStatus <> @DocStatusNotChecked 
			and(@FinancialYear is null or Account.FinancialYear = @FinancialYear )
			and AccDocItem.CostCenter is not null 
			and (@ParentAccount is null 
				or (
					Account.ID = @ParentAccount
					or (Account.ParentAccount is not null and Account.ParentAccount = @ParentAccount)
					or (ParentAccount1.ParentAccount is not null and ParentAccount1.ParentAccount = @ParentAccount)
				)
			)
			and (@ShenavarGroupID is null or CostCenter.CostCenterGroup = @ShenavarGroupID)
	end
	else if(@AccountReviewType = 'Project')
	begin
		set @ShanavarFieldName = 'Project'
		set @AccountType_Name = 'Shenavar_Project'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Name)
		select distinct AccDocItem.Project, 'Shenavar_Project', N'پروژه ها', Project.Name
		from acc_AccDocItems AccDocItem
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts Account on Account.ID = AccDocItem.Account
			left join acc_Accounts ParentAccount1 on ParentAccount1.ID = Account.ParentAccount
			left join cmn_Projects Project on Project.ID = AccDocItem.Project
		where AccDoc.DocStatus <> @DocStatusNotChecked 
			and(@FinancialYear is null or Account.FinancialYear = @FinancialYear )
			and AccDocItem.Project is not null 
			and (@ParentAccount is null 
				or (
					Account.ID = @ParentAccount
					or (Account.ParentAccount is not null and Account.ParentAccount = @ParentAccount)
					or (ParentAccount1.ParentAccount is not null and ParentAccount1.ParentAccount = @ParentAccount)
				)
			)
			and (@ShenavarGroupID is null or Project.ProjectGroup = @ShenavarGroupID)
	end
	else if(@AccountReviewType = 'OrganizationUnit')
	begin
		set @ShanavarFieldName = 'OrganizationUnit'
		set @AccountType_Name = 'Shenavar_OrganizationUnit'
		
		insert into #AccountReviewTempTable (AccountReviewItemID, AccountType_Name, AccountType_Text, Name)
		select distinct AccDocItem.OrganizationUnit, 'Shenavar_OrganizationUnit', N'واحد های سازمانی', OrganizationInformation.Name
		from acc_AccDocItems AccDocItem
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts Account on Account.ID = AccDocItem.Account
			left join acc_Accounts ParentAccount1 on ParentAccount1.ID = Account.ParentAccount
			left join cmn_OrganizationInformations OrganizationInformation on OrganizationInformation.ID = AccDocItem.OrganizationUnit
		where AccDoc.DocStatus <> @DocStatusNotChecked 
			and(@FinancialYear is null or Account.FinancialYear = @FinancialYear )
			and AccDocItem.OrganizationUnit is not null 
			and (@ParentAccount is null 
				or (
					Account.ID = @ParentAccount
					or (Account.ParentAccount is not null and Account.ParentAccount = @ParentAccount)
					or (ParentAccount1.ParentAccount is not null and ParentAccount1.ParentAccount = @ParentAccount)
				)
			)
	end	
	
	--Calculate amounts:
	if (@AccountReviewType = 'AccountGroup')
	begin
		update AccountReviewItem 
		set DebtorAmount = ItemSummary.DebtorAmount, 
			CreditorAmount = ItemSummary.CreditorAmount
		from #AccountReviewTempTable AccountReviewItem
			left join (
				select Item.AccountReviewItemID,
					sum(AccDocItem.DebtorAmount) DebtorAmount, 
					sum(AccDocItem.CreditorAmount) CreditorAmount
				from #AccountReviewTempTable Item
					left join #AccountsView DocItemAccount on DocItemAccount.GroupID = Item.AccountReviewItemID
					left join acc_AccDocItems AccDocItem on AccDocItem.Account = DocItemAccount.ID 
					left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
				where AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
					and cast(AccDoc.IssueDate as date) >= @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate 
					and AccDoc.DocNo between isnull(@FromDocReferenceNo, AccDoc.DocNo) and isnull(@ToDocReferenceNo, AccDoc.DocNo)
					and AccDoc.FinancialYear = isnull(@FinancialYear, AccDoc.FinancialYear) 
					and AccDoc.FinancialDocType = isnull(@FinancialDocType, AccDoc.FinancialDocType)
					and AccDoc.OrganizationUnit = isnull(@OrganizationUnit, AccDoc.OrganizationUnit)
					and AccDoc.DocStatus <> @DocStatusNotChecked 
					and(
						@NoeTaraz = 'AllCoding'
						or (@NoeTaraz = 'BalanceSheetCoding' and DocItemAccount.KolAccountNature = @BalanceSheetCodingID)
						or (@NoeTaraz = 'CostAndBenefitCoding' and DocItemAccount.KolAccountNature = @CostAndBenefitCodingID)
						)
				group by Item.AccountReviewItemID
			) ItemSummary on ItemSummary.AccountReviewItemID = AccountReviewItem.AccountReviewItemID
	end
	else if @AccountReviewType in ('Kol', 'Moin', 'Tafsili')
	begin
		update AccountReviewItem
		set DebtorAmount = ItemSummary.DebtorAmount,
			CreditorAmount = ItemSummary.CreditorAmount
		from #AccountReviewTempTable AccountReviewItem
			left join (
				select Item.AccountReviewItemID, 
					sum(AccDocItem.DebtorAmount) DebtorAmount,
					sum(AccDocItem.CreditorAmount) CreditorAmount
				from #AccountReviewTempTable Item
					left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Item.AccountReviewItemID
					left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
					left join acc_AccDocItems AccDocItem
						on AccDocItem.Account in (Item.AccountReviewItemID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
					left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
				where Item.AccountType_Name like 'Account[_]%'
					and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
					and cast(AccDoc.IssueDate as date) >= @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate 
					and AccDoc.DocNo between isnull(@FromDocReferenceNo, AccDoc.DocNo) and isnull(@ToDocReferenceNo, AccDoc.DocNo)
					--and (@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) 
					and (@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType)
					and (@OrganizationUnit is null or accDoc.OrganizationUnit = @OrganizationUnit)					
					and AccDoc.DocStatus <> @DocStatusNotChecked 
				group by Item.AccountReviewItemID
			) ItemSummary on ItemSummary.AccountReviewItemID = AccountReviewItem.AccountReviewItemID
	end
	else if (@AccountType_Name like 'Shenavar_%')
	begin
		-- Shenavar mode:
		declare @SqlQuery nvarchar(4000)

		set @SqlQuery = '
			declare @BalanceSheetCodingID uniqueidentifier
			declare @CostAndBenefitCodingID uniqueidentifier
			declare @NoeTaraz nvarchar(20)
			declare @AccountType_Name nvarchar(30)
			declare @KolLevelID uniqueidentifier
			declare @FromDate date
			declare @ToDate date
			declare @FromDocReferenceNo int
			declare @ToDocReferenceNo int
			declare @FinancialYear uniqueidentifier
			declare @FinancialDocType uniqueidentifier
			declare @OrganizationUnit uniqueidentifier
			declare @ParentAccount uniqueidentifier 
			declare @DocStatusNotChecked uniqueidentifier
			declare @ShenavarGroupID uniqueidentifier 
			' + CHAR(13)

		-- required parameters:
		set @SqlQuery = @SqlQuery + 'set @BalanceSheetCodingID = ''' + cast(@BalanceSheetCodingID as nvarchar(100)) + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @CostAndBenefitCodingID = ''' + cast(@CostAndBenefitCodingID as nvarchar(100)) + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @NoeTaraz = ''' + @NoeTaraz + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @AccountType_Name = ''' + @AccountType_Name + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @KolLevelID = ''' + cast(@KolLevelID as nvarchar(100)) + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @FromDate = ''' + cast(@FromDate as nvarchar(100)) + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @ToDate = ''' + cast(@ToDate as nvarchar(100)) + '''' + CHAR(13)
		set @SqlQuery = @SqlQuery + 'set @DocStatusNotChecked = ''' + cast(@DocStatusNotChecked as nvarchar(100)) + '''' + CHAR(13)

		-- optional parameters:
		if(@FinancialYear is not null)
			set @SqlQuery = @SqlQuery + 'set @FinancialYear = ''' + cast(@FinancialYear as nvarchar(100)) + '''' + CHAR(13)	
		if (@FinancialDocType is not null)
			set @SqlQuery = @SqlQuery + 'set @FinancialDocType = ''' + cast(@FinancialDocType as nvarchar(100)) + '''' + CHAR(13)	
		if (@OrganizationUnit is not null)
			set @SqlQuery = @SqlQuery + 'set @OrganizationUnit = ''' + cast(@OrganizationUnit as nvarchar(100)) + '''' + CHAR(13)	
		if (@ParentAccount is not null)
			set @SqlQuery = @SqlQuery + 'set @ParentAccount = ''' + cast(@ParentAccount as nvarchar(100)) + '''' + CHAR(13)	
		if (@FromDocReferenceNo is not null)
			set @SqlQuery = @SqlQuery + 'set @FromDocReferenceNo = ''' + cast(@FromDocReferenceNo as nvarchar(100)) + '''' + CHAR(13)
		if (@ToDocReferenceNo is not null)
			set @SqlQuery = @SqlQuery + 'set @ToDocReferenceNo = ''' + cast(@ToDocReferenceNo as nvarchar(100)) + '''' + CHAR(13)
		if (@ShenavarGroupID is not null)
			set @SqlQuery = @SqlQuery + 'set @ShenavarGroupID = ''' + cast(@ShenavarGroupID as nvarchar(100)) + '''' + CHAR(13)
			
		set @SqlQuery = @SqlQuery + CHAR(13) + '
			update AccountReviewItem 
			set DebtorAmount = ItemSummary.DebtorAmount, 
				CreditorAmount = ItemSummary.CreditorAmount
			from #AccountReviewTempTable AccountReviewItem
				left join (
					select Item.AccountReviewItemID, 
						sum(AccDocItem.DebtorAmount) DebtorAmount, 
						sum(AccDocItem.CreditorAmount) CreditorAmount
					from #AccountReviewTempTable Item
						left join acc_AccDocItems AccDocItem on
							(Item.AccountType_Name = @AccountType_Name and AccDocItem.@@ShanavarFieldName = Item.AccountReviewItemID)
						left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
						left join #AccountsView DocItemAccount on DocItemAccount.ID = AccDocItem.Account'
		
		if (@ShenavarGroupID is not null)
		begin
			if (@AccountType_Name = 'Shenavar_Person' )
				set @SqlQuery = @SqlQuery + CHAR(13) + 
						'
						left join cmn_PersonGroupRelations PersonGroupRelation on PersonGroupRelation.Person = AccDocItem.Person
							and PersonGroupRelation.PersonGroup = @ShenavarGroupID
						left join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.Account = AccDocItem.Account
							and PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup
						'
			else if @AccountType_Name = 'Shenavar_CostCenter'
				set @SqlQuery = @SqlQuery + CHAR(13) + 
						'
						left join cmn_CostCenters CostCenter on CostCenter.ID = AccDocItem.CostCenter
							and CostCenter.CostCenterGroup = @ShenavarGroupID
						left join acc_CostCenterGroupAccounts CostCenterGroupAccount on CostCenterGroupAccount.Account = AccDocItem.Account
							and CostCenterGroupAccount.CostCenterGroup = CostCenter.CostCenterGroup
						'
			else if @AccountType_Name = 'Shenavar_Project'
				set @SqlQuery = @SqlQuery + CHAR(13) + 
						'
						left join cmn_Projects Project on Project.ID = AccDocItem.Project
							and Project.ProjectGroup = @ShenavarGroupID
						left join acc_ProjectGroupAccounts ProjectGroupAccount on ProjectGroupAccount.Account = AccDocItem.Account
							and ProjectGroupAccount.ProjectGroup = Project.ProjectGroup
						'
		end

		set @SqlQuery = @SqlQuery + CHAR(13) + '
			where Item.AccountType_Name like ''Shenavar_%''
				and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
				and cast(AccDoc.IssueDate as date) >= @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate 
				and AccDoc.DocNo between isnull(@FromDocReferenceNo, AccDoc.DocNo) and isnull(@ToDocReferenceNo, AccDoc.DocNo)
				and (@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) 
				and (@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType)
				and (@OrganizationUnit is null or accDoc.OrganizationUnit = @OrganizationUnit)
				and AccDoc.DocStatus <> @DocStatusNotChecked 
				and (
					@NoeTaraz = ''AllCoding''
					or (@NoeTaraz = ''BalanceSheetCoding'' and DocItemAccount.KolAccountNature = @BalanceSheetCodingID)
					or (@NoeTaraz = ''CostAndBenefitCoding'' and DocItemAccount.KolAccountNature = @CostAndBenefitCodingID)
					)
				and (@ParentAccount is null 
					or (
						DocItemAccount.ID = @ParentAccount
						or (DocItemAccount.MoinID is not null and DocItemAccount.MoinID = @ParentAccount)
						or (DocItemAccount.KolID is not null and DocItemAccount.KolID = @ParentAccount)
					)
				)		
			group by Item.AccountReviewItemID) ItemSummary on ItemSummary.AccountReviewItemID = AccountReviewItem.AccountReviewItemID'
		
		set @SqlQuery = REPLACE(@SqlQuery, '@@ShanavarFieldName', @ShanavarFieldName)
		--print @SqlQuery
		exec (@SqlQuery)
		-- end of Shenavar mode
	end
		
	delete #AccountReviewTempTable where DebtorAmount is null or CreditorAmount is null	
	
	create table #ResultTable (
		RowNumber int identity(1,1), 
		AccountReviewItemID uniqueidentifier,
		AccountType_Name nvarchar(30),
		AccountType_Text nvarchar(30), 
		Name nvarchar(100), 
		Code nvarchar(50),
		AccountLevel uniqueidentifier,
		AccountGroup uniqueidentifier, 
		DebtorAmount decimal(38,2), 
		CreditorAmount decimal(38,2),
		RemainingDebtorAmount decimal(38,2), 
		RemainingCreditorAmount decimal(38,2),
		TotalRecordsCount int,
		DebtorAmountSum money,
		CreditorAmountSum money)

	-- Group by Recursive query
	--حساب هایی که به صورت درختی از روی یکدیگر کپی شده اند و سورس یکدیگرند در کدینگ مرجع یک حساب شناخته میشوند

	if (@FinancialYear is null and @AccountReviewType in ('Kol', 'Moin', 'Tafsili'))
	begin
		create Table #AccountWithRefs(
			AccountID uniqueidentifier, 
			RefAccountID uniqueidentifier);	

		with AccountWithRef(AccountID, SourceAccountID, RefAccountID)
		as
		(
			select ID, SourceAccount, ID
			from acc_Accounts Account
			where not exists (select 1 from acc_Accounts where SourceAccount = Account.ID)
			union all
			select Account2.ID, Account2.SourceAccount, Account1.RefAccountID
			from acc_Accounts Account2
				inner join AccountWithRef Account1 on Account1.SourceAccountID = Account2.ID
		)
		insert into #AccountWithRefs (AccountID, RefAccountID)
		select AccountID, RefAccountID
		from AccountWithRef

		update AccountReviewTempTable
		set RefAccountReviewItemID = RefAccountReviewItem.AccountReviewItemID, 
			RefItemName = RefAccountReviewItem.Name, 
			RefItemCode = RefAccountReviewItem.Code
		from #AccountReviewTempTable AccountReviewTempTable
			inner join #AccountWithRefs AccountWithRef on AccountWithRef.AccountID = AccountReviewTempTable.AccountReviewItemID
			inner join #AccountReviewTempTable RefAccountReviewItem on RefAccountReviewItem.AccountReviewItemID = AccountWithRef.RefAccountID
	
		update #AccountReviewTempTable
		set RefAccountReviewItemID = AccountReviewItemID, 
			RefItemName = Name, 
			RefItemCode = Code
		where RefAccountReviewItemID is null
		
		insert into #ResultTable (
			AccountReviewItemID,
			AccountType_Name,
			AccountType_Text, 
			Name, 
			Code,
			AccountLevel,
			AccountGroup, 
			DebtorAmount, 
			CreditorAmount)
		select RefAccountReviewItemID,
			AccountType_Name,
			AccountType_Text, 
			RefItemName, 
			RefItemCode,
			AccountLevel,
			AccountGroup,
			sum(DebtorAmount), 
			sum(CreditorAmount)
		from #AccountReviewTempTable
		group by RefAccountReviewItemID,
			AccountType_Name,
			AccountType_Text, 
			RefItemName, 
			RefItemCode,
			AccountLevel,
			AccountGroup	
	end
	else
	begin	
		insert into #ResultTable (
			AccountReviewItemID,
			AccountType_Name,
			AccountType_Text, 
			Name, 
			Code,
			AccountLevel,
			AccountGroup, 
			DebtorAmount, 
			CreditorAmount)
		select AccountReviewItemID,
			AccountType_Name,
			AccountType_Text, 
			Name, 
			Code,
			AccountLevel,
			AccountGroup,
			DebtorAmount, 
			CreditorAmount
		from #AccountReviewTempTable
	end
	
	update #ResultTable 
	set RemainingDebtorAmount = case when DebtorAmount - CreditorAmount > 0 then DebtorAmount - CreditorAmount else 0 end,
		RemainingCreditorAmount = case when CreditorAmount - DebtorAmount > 0 then CreditorAmount - DebtorAmount else 0 end

	if (@RemainedStatusFilter = 'UnZeroRemained')
		delete #ResultTable where RemainingDebtorAmount = 0 and RemainingCreditorAmount = 0	
	
	else if (@RemainedStatusFilter = 'RemainingDebtorAmount')	
	begin
		delete #ResultTable where RemainingDebtorAmount = 0
		delete #ResultTable where RemainingDebtorAmount = 0 and RemainingCreditorAmount = 0
	end
	
	else if (@RemainedStatusFilter = 'RemainingCreditorAmount')	
	begin
		delete #ResultTable where RemainingCreditorAmount = 0
		delete #ResultTable where RemainingDebtorAmount = 0 and RemainingCreditorAmount = 0
	end	

					
	declare @FilterQuery nvarchar(max)
	set @FilterQuery = 'delete from #ResultTable where not( ' + @FilterExpression + ' )'
	exec (@FilterQuery)
	
	update #ResultTable
	set TotalRecordsCount = (select count(1) from #ResultTable),
		DebtorAmountSum = (select sum(DebtorAmount) from #ResultTable),
		CreditorAmountSum = (select sum(CreditorAmount) from #ResultTable)

	--apply paging:
	declare @PagingSqlQuery nvarchar(4000)
	set @PagingSqlQuery = '
		select top ' + cast(@MaxRecords as nvarchar) + ' *
		from (
			select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
			from (
				select * 
				from #ResultTable) NotPagedQuery 
		) NotPagedQuery2
		where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
		'order by NotPagedQuery2._PagingRowNumber '

		--print @MaxRecords
		--print @PagingSqlQuery

	exec (@PagingSqlQuery)
	
end
go

--exec acc.GenerateAccountReview 'AllCoding', '2016/3/21', '2019/3/20', null, null, null, null, null, 'Person', null, null, 'All', null, 'Code', 1, null

afw.BeforeAlterProc 'acc.GenerateTarazAzmayeshi'
go
alter procedure acc.GenerateTarazAzmayeshi
	@NoeTarazAzmayeshi uniqueidentifier, --'TwoColumns', 'FourColumns'
	@FromDate date,
	@ToDate date,
	@FromDocReferenceNo int,
	@ToDocReferenceNo int, 
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier,
	@OrganizationUnit uniqueidentifier,
	@FilterExpression nvarchar(4000),
	@SortExpression nvarchar(500),
	@StartRecordNumber int,
	@MaxRecords int
as
set fmtonly off
begin 
	set nocount on;

	select @FromDate = isnull(@FromDate, StartDate),
		@ToDate = isnull(@ToDate, EndDate)
	from cmn_FinancialYears
	where ID = @FinancialYear
	
	if @FilterExpression is null set @FilterExpression = N'1 = 1'
	if @SortExpression is null set @SortExpression = N'RowNumber'
	if @StartRecordNumber is null set @StartRecordNumber = 1
	if @MaxRecords is null set @MaxRecords = 2000000000

	create table #TarazAzmayeshiTempTable (
		RowNumber int identity(1,1), 
		AccountID uniqueidentifier, 
		Name nvarchar(100), 
		Code nvarchar(50),
		DebtorAmount decimal(38,2), 
		CreditorAmount decimal(38,2),
		RemainingDebtorAmount decimal(38,2), 
		RemainingCreditorAmount decimal(38,2),
		TotalRecordsCount int,
		DebtorAmountSum money,
		CreditorAmountSum money)

	declare @KolLevelID uniqueidentifier

	select @KolLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Kol'
	
	insert into #TarazAzmayeshiTempTable (AccountID, Code, Name)
	select Kol.ID ,Kol.Code, Kol.Name
	from acc_Accounts Kol
	where AccountLevel = @KolLevelID
		and FinancialYear = @FinancialYear 			
					
	declare @query nvarchar(max)
	set @query = 'delete from #TarazAzmayeshiTempTable where not( '+@FilterExpression+' )'
	exec sp_executesql @query
	
	--Calculate amounts:

	update TarazAzmayeshiItem
	set DebtorAmount = ItemSummary.DebtorAmount,
		CreditorAmount = ItemSummary.CreditorAmount
	from #TarazAzmayeshiTempTable TarazAzmayeshiItem
		inner join (
			select Item.AccountID, 
				sum(AccDocItem.DebtorAmount) DebtorAmount,
				sum(AccDocItem.CreditorAmount) CreditorAmount
			from #TarazAzmayeshiTempTable Item
				left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Item.AccountID
				left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
				left join acc_AccDocItems AccDocItem
					on AccDocItem.Account in (Item.AccountID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
				left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID				
			where AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
				and cast(AccDoc.IssueDate as date) >= @FromDate and cast(AccDoc.IssueDate as date) <= @ToDate 
				and AccDoc.DocNo between isnull(@FromDocReferenceNo, AccDoc.DocNo) and isnull(@ToDocReferenceNo, AccDoc.DocNo)
				and (@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) 
				and (@FinancialDocType is null or AccDoc.FinancialDocType = @FinancialDocType)
				and (@OrganizationUnit is null or AccDoc.OrganizationUnit = @OrganizationUnit)				
			group by Item.AccountID
		) ItemSummary on ItemSummary.AccountID = TarazAzmayeshiItem.AccountID

	update #TarazAzmayeshiTempTable 
	set RemainingDebtorAmount = case when DebtorAmount - CreditorAmount > 0 then DebtorAmount - CreditorAmount else 0 end,
		RemainingCreditorAmount = case when CreditorAmount - DebtorAmount > 0 then CreditorAmount - DebtorAmount else 0 end

	delete #TarazAzmayeshiTempTable where DebtorAmount is null or CreditorAmount is null

	update #TarazAzmayeshiTempTable
	set TotalRecordsCount = (select count(1) from #TarazAzmayeshiTempTable),
		DebtorAmountSum = (select sum(DebtorAmount) from #TarazAzmayeshiTempTable),
		CreditorAmountSum = (select sum(CreditorAmount) from #TarazAzmayeshiTempTable)

	--apply paging:
	declare @PagingSqlQuery nvarchar(4000)
	set @PagingSqlQuery = '
		select top ' + cast(@MaxRecords as nvarchar) + ' *
		from (
			select ROW_NUMBER() over ( order by ' + @SortExpression + ') _PagingRowNumber, *
			from (
				select * 
				from #TarazAzmayeshiTempTable) NotPagedQuery
		) NotPagedQuery2
		where NotPagedQuery2._PagingRowNumber >= ' + cast(@StartRecordNumber as nvarchar) + ' ' +
		'order by NotPagedQuery2._PagingRowNumber '

		--print @MaxRecords
		--print @PagingSqlQuery

	exec (@PagingSqlQuery)
end
go

afw.BeforeAlterProc 'acc.GenerateAccountAllLevelReportData'
go
alter procedure acc.GenerateAccountAllLevelReportData
	@FinancialYear uniqueidentifier,
	@AccountLevel nvarchar(10),
	@FromFullCode nvarchar(30),
	@ToFullCode  nvarchar(30),
	@FromIssueDate date,
	@ToIssueDate date
as

set fmtonly off
begin 
	set nocount on;

	select @ToIssueDate = isnull(@ToIssueDate, EndDate),
		@FromIssueDate = isnull(@FromIssueDate,StartDate)
	from cmn_FinancialYears
	where ID = @FinancialYear

	create table #AccountAmountsTempTable (		
		AccountID uniqueidentifier,
		AccountCodeAndName nvarchar(max),
		AccountParent uniqueidentifier,
		HasAmount bit,  		
		DebtorAmount money, 
		CreditorAmount money,
		RemainingDebtorAmount money, 
		RemainingCreditorAmount money
		)

	declare @KolLevelID uniqueidentifier
	declare @MoinLevelID uniqueidentifier
	declare @TafsiliLevelID uniqueidentifier
	
	select @KolLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Kol'
	select @MoinLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Moin'
	select @TafsiliLevelID = ID from afw_OptionSetItemsView where FullName = 'acc.AccountLevel.Tafsili'

	if @AccountLevel = 'Kol'
	begin 		
		insert into #AccountAmountsTempTable (AccountID, AccountParent, AccountCodeAndName)
		select Kol.ID , Kol.GroupID , Kol.CodeAndName
		from acc_AccountsView Kol			
		where Kol.AccountLevel = @KolLevelID
			and Kol.FinancialYear = @FinancialYear 	
			and acc.ToComparableAccountFullCodeWithGroupCode(Kol.FullCodeWithGroupCode) >= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@FromFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Kol.FullCodeWithGroupCode))
			and acc.ToComparableAccountFullCodeWithGroupCode(Kol.FullCodeWithGroupCode) <= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@ToFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Kol.FullCodeWithGroupCode))		
	end
	else if @AccountLevel = 'Moin'
	begin 		
		insert into #AccountAmountsTempTable (AccountID, AccountParent, AccountCodeAndName)
		select Moin.ID , Moin.KolID , Moin.CodeAndName
		from acc_AccountsView Moin			
		where Moin.AccountLevel = @MoinLevelID
			and Moin.FinancialYear = @FinancialYear 	
			and acc.ToComparableAccountFullCodeWithGroupCode(Moin.FullCodeWithGroupCode) >= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@FromFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Moin.FullCodeWithGroupCode))
			and acc.ToComparableAccountFullCodeWithGroupCode(Moin.FullCodeWithGroupCode) <= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@ToFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Moin.FullCodeWithGroupCode))		
	end
    else if @AccountLevel = 'Tafsili'
	begin
		insert into #AccountAmountsTempTable (AccountID, AccountParent, AccountCodeAndName)
		select Tafsili.ID , Tafsili.MoinID , Tafsili.CodeAndName
		from acc_AccountsView Tafsili			
		where Tafsili.AccountLevel = @TafsiliLevelID
			and Tafsili.FinancialYear = @FinancialYear 	
			and acc.ToComparableAccountFullCodeWithGroupCode(Tafsili.FullCodeWithGroupCode) >= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@FromFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Tafsili.FullCodeWithGroupCode))
			and acc.ToComparableAccountFullCodeWithGroupCode(Tafsili.FullCodeWithGroupCode) <= isnull(acc.ToComparableAccountFullCodeWithGroupCode(@ToFullCode) , acc.ToComparableAccountFullCodeWithGroupCode(Tafsili.FullCodeWithGroupCode))		
	end	
	
	--Calculate amounts:

	update AccountAmountsItem
	set DebtorAmount = ItemSummary.DebtorAmount,
		CreditorAmount = ItemSummary.CreditorAmount
	from #AccountAmountsTempTable AccountAmountsItem
		inner join (
			select Item.AccountID, 
				sum(AccDocItem.DebtorAmount) DebtorAmount,
				sum(AccDocItem.CreditorAmount) CreditorAmount
			from #AccountAmountsTempTable Item
				left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Item.AccountID
				left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
				left join acc_AccDocItems AccDocItem
					on AccDocItem.Account in (Item.AccountID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
				left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
				left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account				
			where AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
				and (@FinancialYear is null or AccDoc.FinancialYear = @FinancialYear) 
				and AccDoc.IssueDate >= @FromIssueDate and AccDoc.IssueDate < @ToIssueDate 				
			group by Item.AccountID
		) ItemSummary on ItemSummary.AccountID = AccountAmountsItem.AccountID

	update #AccountAmountsTempTable 
	set RemainingDebtorAmount = case when DebtorAmount - CreditorAmount > 0 then DebtorAmount - CreditorAmount else 0 end,
		RemainingCreditorAmount = case when CreditorAmount - DebtorAmount > 0 then CreditorAmount - DebtorAmount else 0 end,
		HasAmount = case when DebtorAmount is null or CreditorAmount is null then 0 else 1 end
	
	select * from #AccountAmountsTempTable
end
go
 

afw.BeforeAlterProc 'acc.CopyAccountsAndDependencies'
go
alter procedure acc.CopyAccountsAndDependencies
	@SourceFinancialYear uniqueidentifier, @DestinationFinancialYear uniqueidentifier as
begin	
	--insert Kol Account
	insert into acc_Accounts(ID,
		SourceAccount,
		FinancialYear,
		AccountGroup,
		AccountLevel,
		AccountNature,
		Code,
		Name,
		ParentAccount		
		)  		  
	select newID(),
		Account.ID,
		@DestinationFinancialYear,
		Account.AccountGroup,
		Account.AccountLevel,
		Account.AccountNature,
		Account.Code,
		Account.Name,
		null
	from acc_Accounts Account
		left join afw_OptionSetItems AccountLevel on Account.AccountLevel = AccountLevel.ID
	where AccountLevel.Name = 'Kol'
		and FinancialYear = @SourceFinancialYear
		
	--insert Moin Account
	insert into acc_Accounts(ID,
		SourceAccount,
		FinancialYear,
		AccountGroup,
		AccountLevel,
		AccountNature,
		Code,
		Name,
		ParentAccount		
		)  		  
	select newID(),
		Account.ID,
		@DestinationFinancialYear,
		Account.AccountGroup,
		Account.AccountLevel,
		Account.AccountNature,
		Account.Code,
		Account.Name,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ParentAccount
			and FinancialYear = @DestinationFinancialYear)
	from acc_Accounts Account
		left join afw_OptionSetItems AccountLevel on Account.AccountLevel = AccountLevel.ID
	where AccountLevel.Name = 'Moin'
		and FinancialYear = @SourceFinancialYear
		
	--insert Tafsili Account
	insert into acc_Accounts(ID,
		SourceAccount,
		FinancialYear,
		AccountGroup,
		AccountLevel,
		AccountNature,
		Code,
		Name,
		ParentAccount		
		)  		  
	select newID(),
		Account.ID,
		@DestinationFinancialYear,
		Account.AccountGroup,
		Account.AccountLevel,
		Account.AccountNature,
		Account.Code,
		Account.Name,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ParentAccount
			and FinancialYear = @DestinationFinancialYear)
	from acc_Accounts Account
		left join afw_OptionSetItems AccountLevel on Account.AccountLevel = AccountLevel.ID
	where AccountLevel.Name = 'Tafsili'
		and FinancialYear = @SourceFinancialYear
	
	--Set PersonGroupAccounts
	insert into acc_PersonGroupAccounts(ID,
		PersonGroup,
		Account		
	)
	select NEWID(),
		PersonGroup,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ID and
			FinancialYear = @DestinationFinancialYear)
	from acc_PersonGroupAccounts PersonGroupAccount
		left join acc_Accounts Account on PersonGroupAccount.Account = Account.ID
	where Account.FinancialYear = @SourceFinancialYear
	
	--Set CostCenterGroupAccounts
	insert into acc_CostCenterGroupAccounts(ID,
		CostCenterGroup,
		Account		
	)
	select NEWID(),
		CostCenterGroup,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ID and
			FinancialYear = @DestinationFinancialYear)
	from acc_CostCenterGroupAccounts CostCenterGroupAccount
		left join acc_Accounts Account on CostCenterGroupAccount.Account = Account.ID
	where Account.FinancialYear = @SourceFinancialYear
	
	--Set ProjectGroupAccounts
	insert into acc_ProjectGroupAccounts(ID,
		ProjectGroup,
		Account		
	)
	select NEWID(),
		ProjectGroup,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ID and
			FinancialYear = @DestinationFinancialYear)
	from acc_ProjectGroupAccounts ProjectGroupAccount
		left join acc_Accounts Account on ProjectGroupAccount.Account = Account.ID
	where Account.FinancialYear = @SourceFinancialYear
	
	--Set ForeignCurrencyGroupAccounts
	insert into acc_ForeignCurrencyGroupAccounts(ID,
		ForeignCurrencyGroup,
		Account		
	)
	select newID(),
		ForeignCurrencyGroup,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ID and
			FinancialYear = @DestinationFinancialYear)
	from acc_ForeignCurrencyGroupAccounts ForeignCurrencyGroupAccount
		left join acc_Accounts Account on ForeignCurrencyGroupAccount.Account = Account.ID
	where Account.FinancialYear = @SourceFinancialYear	
	
	-- Copy FloatPriorities
	insert into cmn_FloatPriorities( ID,
		FinancialYear,
		Account,
		CostCenterPriority,
		ForeignCurrencyPriority,
		PersonPriority,
		ProjectPriority
		)
	select newID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts 
		 where SourceAccount = Account.ID and
			FinancialYear = @DestinationFinancialYear),
		CostCenterPriority,
		ForeignCurrencyPriority,
		PersonPriority,
		ProjectPriority
	from cmn_FloatPriorities FloatPriority
		left join acc_Accounts Account on Account.ID = FloatPriority.Account
	where Account.FinancialYear = @SourceFinancialYear
		
end
go

afw.BeforeAlterIF 'acc.GetAccountAmountSum'
go
alter function acc.GetAccountAmountSum (
	@AccountID uniqueidentifier,
	@FinancialYear uniqueidentifier,
	@OrganizationUnit uniqueidentifier,
	@FromDate date,
	@ToDate date
	) returns table as 
	return	
		select sum(AccDocItem.DebtorAmount) DebtorAmountSum,
			sum(AccDocItem.CreditorAmount) CreditorAmountSum
		from acc_Accounts Account
			left join acc_Accounts ItemChildAccount1 on ItemChildAccount1.ParentAccount = Account.ID
			left join acc_Accounts ItemChildAccount2 on ItemChildAccount2.ParentAccount = ItemChildAccount1.ID
			left join acc_AccDocItems AccDocItem
				on AccDocItem.Account in (Account.ID, ItemChildAccount1.ID, ItemChildAccount2.ID)			
			left join acc_AccDocs AccDoc on AccDocItem.AccDoc = AccDoc.ID
			left join acc_Accounts DocItemAccount on DocItemAccount.ID = AccDocItem.Account
			left join acc_Accounts DocItemParentAccount1 on DocItemParentAccount1.ID = DocItemAccount.ParentAccount
		where Account.ID = @AccountID
			and AccDoc.IsActive = 1 and AccDocItem.IsActive = 1
			and isnull(@FinancialYear, AccDoc.FinancialYear) = AccDoc.FinancialYear
			and isnull(@OrganizationUnit, AccDoc.OrganizationUnit) = AccDoc.OrganizationUnit
			and AccDoc.IssueDate between isnull(@FromDate, AccDoc.IssueDate) and isnull(@ToDate, AccDoc.IssueDate)
go


afw.BeforeAlterProc 'acc.AccDocPrintWithOutFloat'
go
alter procedure acc.AccDocPrintWithOutFloat
	@FromDocReferenceNo bigint,
	@ToDocReferenceNo bigint, 
	@FinancialYear uniqueidentifier,
	@FinancialDocType uniqueidentifier
as 
begin  
	select AccDoc.DocNo, AccountView.FullCode AllCode, 
		sum(TempAccDoc.DebtorAmount) DebtorAmount, 
		sum(TempAccDoc.CreditorAmount) CreditorAmount, TempAccDoc.SubMaster, TempAccDoc.subDetail,
		AccDoc.Description DocDescription, afw.GregorianToPersian(AccDoc.IssueDate) IssueDate, AccountView.FullName AllName
	from (   
			/*Debtor*/
			select DocItem.AccDoc, AccountView.ParentAccount, AccountView.ID Account, DebtorAmount, 0 CreditorAmount, 1 SubMaster, 1 subDetail, 
				DocItem.Note, DocItem.RowNo 
			from acc_AccDocItems DocItem
				inner join acc_AccountsView AccountView on AccountView.ID = DocItem.Account 
				left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc
			Where AccountView.ParentAccount is not null 
				and DocItem.CreditorAmount = 0 
				and Doc.FinancialYear = @FinancialYear 
				and FinancialDocType = @FinancialDocType
				and Doc.DocNo >= @FromDocReferenceNo 
				and Doc.DocNo <= @ToDocReferenceNo		
			union			
			/*Creditor*/
			select DocItem.AccDoc, AccountView.ParentAccount, AccountView.ID Account, 0 DebtorAmount, CreditorAmount CreditorAmount, 2 SubMaster, 1 subDetail, 
				DocItem.Note, DocItem.RowNo 
			from acc_AccDocItems DocItem
				inner join acc_AccountsView AccountView on AccountView.ID = DocItem.Account 
				left join acc_AccDocs Doc on Doc.ID = DocItem.AccDoc
			Where AccountView.ParentAccount is not null 
				and DocItem.DebtorAmount = 0 
				and Doc.FinancialYear = @FinancialYear 
				and FinancialDocType = @FinancialDocType
				and Doc.DocNo >= @FromDocReferenceNo 
				and Doc.DocNo <= @ToDocReferenceNo	  
			) TempAccDoc 
		inner join acc_AccDocs AccDoc on AccDoc.ID = TempAccDoc.AccDoc
		inner join acc_AccountsView AccountView on AccountView.ID = TempAccDoc.Account
	group by AccDoc.DocNo,  AccountView.FullCode, TempAccDoc.SubMaster, TempAccDoc.subDetail,
		AccDoc.Description, AccDoc.IssueDate, AccountView.FullName
	order by TempAccDoc.SubMaster, TempAccDoc.subDetail
end
go