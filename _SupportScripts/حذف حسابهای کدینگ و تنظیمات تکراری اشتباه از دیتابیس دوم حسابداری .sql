--حذف حسابهای کدینگ و تنظیمات تکراری اشتباه از دیتابیس دوم حسابداری 
		select Account.FullCode, COUNT(*)
		from acc_AccountsView Account
		where Account.FinancialYear = (select ID from cmn_FinancialYears where YearNo = '1397')
		group by Account.FullCode
		having COUNT(*) > 1

--حساب هایی که در سیستم دوم هستند و با همان آیدی در سیستم اول در سال مالی دیگری هستند
/*
select Db2Account.ID, Db2Account.FullCode, Db2Account.FullName
from MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2Account
	inner join MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1Account
		on Db1Account.ID = Db2Account.ID and Db1Account.FinancialYear <> Db2Account.FinancialYear
--و بالعکس:
select Db1Account.ID, Db1Account.FullCode, Db1Account.FullName
from MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1Account
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2Account
		on Db2Account.ID = Db1Account.ID and Db2Account.FinancialYear <> Db1Account.FinancialYear	
--هیچ موردی وجود ندارد
--اگه موردی بود، قضیه پیچیده تر میشد و کوئری های بعدی جواب نمیداد	

-- شماره حساب تکراری در سیستم اول
select FinancialYear, FullCode, COUNT(*)
from MegaModavem_AppFrameworkDB.dbo.acc_AccountsView
group by FinancialYear, FullCode
having COUNT(*) > 1
--هیچ موردی وجود ندارد
--اگه موردی بود، قضیه پیچیده تر میشد و کوئری های بعدی جواب نمیداد	
*/

--اگر شماره دو حساب تکراری باشد اونی که آیدیش در دیتابیس اول وجود داره اصلی در نظر میگیریم و بقیه رو حذف میکنیم

--اصلاح حساب ها
update Db2Account set ParentAccount = Db1ParentAccount.ID
from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts Db2Account
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2ParentAccount on Db2ParentAccount.ID = Db2Account.ParentAccount
	inner join MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1ParentAccount on Db1ParentAccount.FullCode = Db2ParentAccount.FullCode
		and Db1ParentAccount.FinancialYear = Db2ParentAccount.FinancialYear
where Db2ParentAccount.ID <> Db1ParentAccount.ID

update Db2Account set SourceAccount = Db1SourceAccount.ID
from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts Db2Account
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2SourceAccount on Db2SourceAccount.ID = Db2Account.SourceAccount
	inner join MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1SourceAccount on Db1SourceAccount.FullCode = Db2SourceAccount.FullCode
		and Db1SourceAccount.FinancialYear = Db2SourceAccount.FinancialYear
where Db2SourceAccount.ID <> Db1SourceAccount.ID

--اصلاح اسناد
--select *
update Db2AccDocItem set Account = Db1Account.ID
from MegaModavem_AppFrameworkDB2.dbo.acc_AccDocItems Db2AccDocItem
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2Account on Db2Account.ID = Db2AccDocItem.Account
	inner join MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1Account on Db1Account.FullCode = Db2Account.FullCode
		and Db1Account.FinancialYear = Db2Account.FinancialYear
where Db2Account.ID <> Db1Account.ID

--اصلاح سایر اطلاعات
delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cmn_FinancialGroups Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cmn_FinancialGroups)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cmn_ServiceAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cmn_ServiceAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cmn_DiscountAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cmn_DiscountAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cmn_StuffLocationAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cmn_StuffLocationAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cmn_FloatPriorities Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cmn_FloatPriorities)


delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.acc_PersonGroupAccounts Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.acc_PersonGroupAccounts)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.acc_CostCenterGroupAccounts Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.acc_CostCenterGroupAccounts)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.acc_ProjectGroupAccounts Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.acc_ProjectGroupAccounts)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.acc_ForeignCurrencyGroupAccounts Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.acc_ForeignCurrencyGroupAccounts)


delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.rp_FinancialOpKindAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.rp_FinancialOpKindAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.rp_ChequeStatusChangeAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.rp_ChequeStatusChangeAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.rp_TarafHesabeTankhahAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.rp_TarafHesabeTankhahAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.rp_CashAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.rp_CashAccSettings)

delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.rp_TankhahGardanAccSettings Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.rp_TankhahGardanAccSettings)


delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.wm_WarehouseDocsAccSettingss Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.wm_WarehouseDocsAccSettingss)


delete Db2Entity 
from MegaModavem_AppFrameworkDB2.dbo.cc_DefinedFinancialDeclarations Db2Entity
where ID not in (select ID from MegaModavem_AppFrameworkDB.dbo.cc_DefinedFinancialDeclarations)

--update Db2Entity set HesabeAsnadePardakhtani = Db1Account.ID
--from MegaModavem_AppFrameworkDB2.dbo.cmn_BankAccountAccSettings Db2Entity
--	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2Account on Db2Account.ID = Db2Entity.HesabeAsnadePardakhtani
--	inner join MegaModavem_AppFrameworkDB.dbo.acc_AccountsView Db1Account on Db1Account.FullCode = Db2Account.FullCode
--		and Db1Account.FinancialYear = Db2Account.FinancialYear
--where Db2Account.ID <> Db1Account.ID


--حالا میدانیم که حسابهای اضافی قابل حذف هستند چون هیچ ارجاعی به آنها وجود ندارد. 

-- حذف همه تفصیلی های تکراری اضافه
--- تفصیلی هایی که شماره آنها در همان سال در دیتابیس 1 وجود دارد و آیدی اونها در دیتابیس 1 وجود نداره.
--یعنی یه آیدی دیگه با همون شماره در دیتابیس 1 هست که اون باید به دیتابیس 2 منتقل شده باشه
delete Db2TafsiliAccount 
from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts Db2TafsiliAccount 
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2TafsiliAccountView on Db2TafsiliAccountView.ID = Db2TafsiliAccount.ID
where Db2TafsiliAccountView.AccountLevel_Name = 'Tafsili'
	and exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_AccountsView
		where FullCode = Db2TafsiliAccountView.FullCode
			and FinancialYear = Db2TafsiliAccount.FinancialYear
	)
	and not exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_Accounts
		where ID = Db2TafsiliAccountView.ID
	)
	
-- حذف همه معین های تکراری اضافه
delete Db2MoinAccount 
from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts Db2MoinAccount 
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2MoinAccountView on Db2MoinAccountView.ID = Db2MoinAccount.ID
where Db2MoinAccountView.AccountLevel_Name = 'Moin'
	and exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_AccountsView
		where FullCode = Db2MoinAccountView.FullCode
			and FinancialYear = Db2MoinAccountView.FinancialYear
	)
	and not exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_Accounts
		where ID = Db2MoinAccountView.ID
	)
	

-- حذف همه کل های تکراری اضافه
delete Db2KolAccount 
from MegaModavem_AppFrameworkDB2.dbo.acc_Accounts Db2KolAccount 
	inner join MegaModavem_AppFrameworkDB2.dbo.acc_AccountsView Db2KolAccountView on Db2KolAccountView.ID = Db2KolAccount.ID
where Db2KolAccountView.AccountLevel_Name = 'Kol'
	and exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_AccountsView
		where FullCode = Db2KolAccountView.FullCode
			and FinancialYear = Db2KolAccountView.FinancialYear
	)
	and not exists (
		select 1
		from MegaModavem_AppFrameworkDB.dbo.acc_Accounts
		where ID = Db2KolAccountView.ID
	)