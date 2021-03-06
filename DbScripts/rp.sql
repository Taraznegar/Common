afw.BeforeAlterView 'rp_ReceivedChequesView'
go
alter view rp_ReceivedChequesView as
	select Cheque.ID, Cheque.CreationTime, Cheque.CreatorUser, Cheque.LastModifyTime,
			Cheque.ChequeNumber, Cheque.DueDate, Cheque.Bank, Cheque.RadifeDaftareChek, 
			Cheque.ChequeStatus ChequeStatus, Cheque.Amount, Cheque.Description, Cheque.Payer, Cheque.DocImage,
			afw.GregorianToPersian(Cheque.DueDate) DueDate_Persian,
			Payer.FullName Payer_FullName, Bank.Name Bank_Name,
			ChequeStatusOptionSetItem.Title ChequeStatus_Text,
			ReceiveReceiptItem.FinancialOpKind,
			case when ReceiveReceipt.ReceiptNumber is not null then ReceiveReceipt.ReceiptNumber
				 when ReceiptDriver.ReceiptNumber is not null then ReceiptDriver.ReceiptNumber
				 end ReceiveReceipt_Number,
			case when ReceiveReceipt.FinancialYear is not null then ReceiveReceipt.FinancialYear
				 when ReceiptDriver.FinancialYear is not null then ReceiptDriver.FinancialYear
				 end ReceiveReceipt_FinancialYear,
			case when ReceiveReceipt.FinancialGroup is not null then ReceiveReceipt.FinancialGroup
				 when ReceiptDriver.FinancialGroup is not null then ReceiptDriver.FinancialGroup
				 end ReceiveReceipt_FinancialGroup, 
			ReceiveReceipt.ReceiptDate,
			afw.GregorianToPersian(ReceiveReceipt.ReceiptDate) ReceiptDate_Persian,
			ChequeTag.Title ChequeTag_Text, Cheque.Note
		from rp_ReceivedCheques Cheque
			inner join cmn_PersonsView Payer on Payer.ID = Cheque.Payer
			inner join cmn_Banks Bank on Bank.ID = Cheque.Bank
			inner join afw_OptionSetItems ChequeStatusOptionSetItem on ChequeStatusOptionSetItem.ID = Cheque.ChequeStatus
			left join rp_ReceiveReceiptItems ReceiveReceiptItem	on ReceiveReceiptItem.FinancialItem_Cheque = Cheque.ID
			left join rp_ReceiveReceipts ReceiveReceipt	on ReceiveReceipt.ID = ReceiveReceiptItem.ReceiveReceipt
			left join cdis_ReceiptDriverItems ReceiptDriverItem	on ReceiptDriverItem.FinancialItem_Cheque = Cheque.ID
			left join cdis_ReceiptDrivers ReceiptDriver	on ReceiptDriver.ID = ReceiptDriverItem.ReceiptDriver
			left join rp_ChequeTags ChequeTag on ChequeTag.ID = Cheque.ChequeTag
go

afw.BeforeAlterView 'rp_SafteDaryaftiView'
go
alter view rp_SafteDaryaftiView as
	select Safte.ID,
		Safte.Payer,
		Safte.ShomareSafte,
		Payer.FullName Payer_FullName,
		Safte.Amount,
		Safte.Description
	from rp_SafteDaryafti Safte
		inner join cmn_PersonsView Payer on Payer.ID = Safte.Payer		
go

afw.BeforeAlterView 'rp_HavaleDaryaftiView'
go
alter view rp_HavaleDaryaftiView as
	select Havale.ID,
	    Havale.BankAccount,
		Havale.ShomareHavale,
		Havale.Payer,
		Payer.FullName Payer_FullName,
		BankAccount.AccountNumber BankAccount_AccountNumber,
		BankAccount.Code BankAccount_Code,
		BankAccount.Title BankAccount_Title,
		Havale.Amount,
		Havale.Description
	from rp_HavaleDaryafti Havale
		inner join cmn_PersonsView Payer on Payer.ID = Havale.Payer
		inner join cmn_BankAccounts BankAccount on BankAccount.ID = Havale.BankAccount			
go

afw.BeforeAlterView 'rp_ReceivedPosView'
go
alter view rp_ReceivedPosView as
	select ReceivedPos.ID,
	    ReceivedPos.BankAccount,
		ReceivedPos.Payer,
		Payer.FullName Payer_FullName,
		BankAccount.AccountNumber BankAccount_AccountNumber,
		BankAccount.Code BankAccount_Code,
		BankAccount.Title BankAccount_Title,
		ReceivedPos.Amount,
		N'دریافت پوز به حساب ' + BankAccount.Title + N' شماره حساب ' + BankAccount.AccountNumber + N' پرداخت کننده: ' + Payer.FullName Description
	from rp_ReceivedPoses ReceivedPos
		inner join cmn_PersonsView Payer on Payer.ID = ReceivedPos.Payer
		inner join cmn_BankAccounts BankAccount on BankAccount.ID = ReceivedPos.BankAccount
go

afw.BeforeAlterView 'rp_NaghdeDaryaftiView'
go
alter view rp_NaghdeDaryaftiView as
	select Naghd.ID,
		Naghd.Payer,
		Cash.Code Cash_Code,
		Cash.Title Cash_Title,
		Payer.FullName Payer_FullName,
		Naghd.Amount,
		Naghd.Description,
		Cash.CashOwnerPerson
	from rp_NaghdeDaryafti Naghd
		inner join cmn_PersonsView Payer on Payer.ID = Naghd.Payer
		inner join rp_Cashs Cash on Cash.ID = Naghd.Cash		
go

afw.BeforeAlterView 'rp_ChekeZemanateDaryaftiView'
go
alter view rp_ChekeZemanateDaryaftiView as
	select ChekeZemanat.ID, ChekeZemanat.CreatorUser, ChekeZemanat.CreationTime, 
		ChekeZemanat.LastModifierUser, ChekeZemanat.LastModifyTime, ChekeZemanat.OwnerUser,
		ChekeZemanat.Number, ChekeZemanat.DueDate, ChekeZemanat.Bank, ChekeZemanat.RadifeDaftareChek, 
		ChekeZemanat.Amount, ChekeZemanat.Description, ChekeZemanat.Payer,
		ChekeZemanat.DocImage, ChekeZemanat.NoeChekeZemanat,
		afw.GregorianToPersian(ChekeZemanat.DueDate) DueDate_Persian,
		Payer.FullName Payer_FullName,
		Bank.Name Bank_Name,
		NoeChekeZemanatOptionSet.Title NoeChekeZemanat_Text		
	from rp_ChekeZemanateDaryafti ChekeZemanat
		inner join cmn_PersonsView Payer on Payer.ID = ChekeZemanat.Payer
		inner join cmn_Banks Bank on Bank.ID = ChekeZemanat.Bank	
		inner join afw_OptionSetItems NoeChekeZemanatOptionSet on NoeChekeZemanatOptionSet.ID = ChekeZemanat.NoeChekeZemanat	
go

afw.BeforeAlterView 'rp_ReceiveReceiptItemsView'
go
alter view rp_ReceiveReceiptItemsView as
	select ReceiveReceiptItem.ID, ReceiveReceiptItem.CreatorUser, ReceiveReceiptItem.CreationTime, ReceiveReceiptItem.LastModifierUser,
		ReceiveReceiptItem.LastModifyTime, ReceiveReceiptItem.OwnerUser, ReceiveReceiptItem.ReceiveType, ReceiveReceiptItem.FinancialOpKind,
		ReceiveReceiptItem.ReceiveReceipt, ReceiveReceiptItem.FinancialItem_Cheque, ReceiveReceiptItem.FinancialItem_Havale, 
		ReceiveReceiptItem.FinancialItem_Safte, ReceiveReceiptItem.FinancialItem_Naghd, ReceiveReceiptItem.FinancialItem_ChekeZemanat, 
		ReceiveType.Title ReceiveType_Title,
		case when ReceiveType.Name = 'Cheque' then Cheque.RadifeDaftareChek
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.RadifeDaftareChek
		end RadifeDaftareChek,
		case when ReceiveType.Name = 'Cheque' then Cheque.Payer
			when ReceiveType.Name = 'Safte' then Safte.Payer
			when ReceiveType.Name = 'Havale' then Havale.Payer
			when ReceiveType.Name = 'Naghd' then Naghd.Payer
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Payer
			when ReceiveType.Name = 'Pos' then Pos.Payer
		end Payer,
		case when ReceiveType.Name = 'Cheque' then Cheque.Payer_FullName
			when ReceiveType.Name = 'Safte' then Safte.Payer_FullName
			when ReceiveType.Name = 'Havale' then Havale.Payer_FullName
			when ReceiveType.Name = 'Naghd' then Naghd.Payer_FullName
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Payer_FullName
			when ReceiveType.Name = 'Pos' then Pos.Payer_FullName
		end Payer_FullName,
		case when ReceiveType.Name = 'Cheque' then Cheque.ChequeNumber
			when ReceiveType.Name = 'Safte' then Safte.ShomareSafte
			when ReceiveType.Name = 'Havale' then Havale.ShomareHavale
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Number
		end ItemNo,
		case when ReceiveType.Name = 'Cheque' then afw.GregorianToPersian(Cheque.DueDate)
			when ReceiveType.Name = 'ChekeZemanat' then afw.GregorianToPersian(ChekeZemanat.DueDate)
		end DueDate,
		case when ReceiveType.Name = 'Cheque' then Cheque.Bank_Name
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Bank_Name
		end BankName,		
		case when ReceiveType.Name = 'Havale' then Havale.BankAccount_AccountNumber
			when ReceiveType.Name = 'Pos' then Pos.BankAccount_AccountNumber
		end BankAccount_AccountNumber,		
		case when ReceiveType.Name = 'Havale' then Havale.BankAccount_Code
			when ReceiveType.Name = 'Pos' then Pos.BankAccount_Code
		end BankAccount_Code,				
		case when ReceiveType.Name = 'Havale' then Havale.BankAccount_Title
			when ReceiveType.Name = 'Pos' then Pos.BankAccount_Title
		end BankAccount_Title,
		Naghd.Cash_Code Cash_Code,
		Naghd.Cash_Title Cash_Title,
		case when ReceiveType.Name = 'Cheque' then Cheque.Amount
			when ReceiveType.Name = 'Safte' then Safte.Amount
			when ReceiveType.Name = 'Havale' then Havale.Amount
			when ReceiveType.Name = 'Naghd' then Naghd.Amount
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
			when ReceiveType.Name = 'Pos' then Pos.Amount
		end Amount,
		case when ReceiveType.Name = 'Cheque' then Cheque.Description
			when ReceiveType.Name = 'Safte' then Safte.Description
			when ReceiveType.Name = 'Havale' then Havale.Description
			when ReceiveType.Name = 'Naghd' then Naghd.Description
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Description
			when ReceiveType.Name = 'Pos' then Pos.Description
		end ItemDescription,
		case when ReceiveType.Name = 'Cheque' then N'چک شماره  ' + Cheque.ChequeNumber 
				+ N' مورخ ' + afw.GregorianToPersian(Cheque.DueDate) + N' از ' + Cheque.Payer_FullName 
			when ReceiveType.Name = 'Safte' then Safte.Description
			when ReceiveType.Name = 'Havale' then N'واریز توسط ' + Havale.Payer_FullName
			when ReceiveType.Name = 'Naghd' then N'دریافت از ' + Naghd.Payer_FullName
			when ReceiveType.Name = 'ChekeZemanuat' then ChekeZemanat.Description
			when ReceiveType.Name = 'Pos' then Pos.Description
		end ItemDebtorDescription,
		case when ReceiveType.Name = 'Cheque' then N'چک شماره ' + Cheque.ChequeNumber + N' مورخ ' + afw.GregorianToPersian(Cheque.DueDate)
				+ N' از ' + Cheque.Payer_FullName 
				+ case when Creditor_Project.Name is not null or Creditor_CostCenter.Name is not null then N' بابت ' else '' end
				+ isnull(N' پروژه ' + Creditor_Project.Name, '')
				+ isnull(
					case when Creditor_Project.Name is not null then N' و ' else '' end 
					+ N' مرکز هزینه ' + Creditor_CostCenter.Name, 
					'')
			when ReceiveType.Name = 'Safte' then Safte.Description
			when ReceiveType.Name = 'Havale' then N'واریز به ' + Havale.BankAccount_Title + ' - ' + Havale.BankAccount_AccountNumber 
			when ReceiveType.Name = 'Naghd' then N'پرداخت نقدی'
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Description
			when ReceiveType.Name = 'Pos' then Pos.Description
		end ItemCreditorDescription,
		ReceiveReceiptItem.DebtorAccount, ReceiveReceiptItem.CreditorAccount,
		case when ReceiveReceiptItem.FinancialOpKind is null then N'انتخاب از کدینگ حسابداری' 
			else FinancialOpKind.Title
			end Title, 
		DebtorAccount.CodeAndName DebtorAccount_Text, 
		CreditorAccount.CodeAndName CreditorAccount_Text, 
		case when ReceiveType.Name = 'Naghd' then ReceiveReceiptItem.Debtor_Person end CashOwnerPerson,
		ReceiveReceiptItem.Creditor_CostCenter, ReceiveReceiptItem.Creditor_Project
	from rp_ReceiveReceiptItems ReceiveReceiptItem
		inner join rp_ReceiveTypes ReceiveType on ReceiveReceiptItem.ReceiveType = ReceiveType.ID
		left join rp_ReceivedChequesView Cheque on Cheque.ID = ReceiveReceiptItem.FinancialItem_Cheque
		left join rp_SafteDaryaftiView Safte on Safte.ID = ReceiveReceiptItem.FinancialItem_Safte
		left join rp_HavaleDaryaftiView Havale on Havale.ID = ReceiveReceiptItem.FinancialItem_Havale
		left join rp_NaghdeDaryaftiView Naghd on Naghd.ID = ReceiveReceiptItem.FinancialItem_Naghd
		left join rp_ChekeZemanateDaryaftiView ChekeZemanat on ChekeZemanat.ID = ReceiveReceiptItem.FinancialItem_ChekeZemanat
		left join rp_ReceivedPosView Pos on Pos.ID = ReceiveReceiptItem.FinancialItem_Pos
		left join rp_FinancialOpKinds FinancialOpKind on FinancialOpKind.ID = ReceiveReceiptItem.FinancialOpKind
		left join acc_AccountsView DebtorAccount on DebtorAccount.ID = ReceiveReceiptItem.DebtorAccount
		left join acc_AccountsView CreditorAccount on CreditorAccount.ID = ReceiveReceiptItem.CreditorAccount
		left join cmn_CostCenters Creditor_CostCenter on Creditor_CostCenter.ID = ReceiveReceiptItem.Creditor_CostCenter
		left join cmn_Projects Creditor_Project on Creditor_Project.ID = ReceiveReceiptItem.Creditor_Project
go

afw.BeforeAlterView 'rp_PaidChequesView'
go
alter view rp_PaidChequesView as
	select Cheque.ID, Cheque.CreationTime, Cheque.CreatorUser, Cheque.LastModifyTime, Cheque.Payee,
			Cheque.ChequeNumber, Cheque.BankAccount, Cheque.Amount, Cheque.ChequeDescription, Cheque.DocImage,
			Cheque.ChequeStatus ChequeStatus, Cheque.DueDate,
			afw.GregorianToPersian(Cheque.DueDate) DueDate_Persian,
			Payee.FullName Payee_FullName,
			BankAccount.AccountNumber BankAccount_Number,
			BankAccount.Code BankAccount_Code,
			BankAccount.Title BankAccount_Title,
			ChequeStatusOptionSetItem.Title ChequeStatus_Text,
			PayReceipt.ReceiptNumber PayReceipt_Number,
			PayReceipt.FinancialYear PayReceipt_FinancialYear,
			PayReceipt.FinancialGroup PayReceipt_FinancialGroup,
			PayReceiptItem.FinancialOpKind, PayReceipt.ReceiptDate,
			afw.GregorianToPersian(PayReceipt.ReceiptDate) ReceiptDate_Persian,
			ChequeTag.Title ChequeTag_Text, Cheque.Note
		from rp_PaidCheques Cheque
			inner join cmn_PersonsView Payee on Payee.ID = Cheque.Payee
			inner join cmn_BankAccounts BankAccount on BankAccount.ID = Cheque.BankAccount
			left join rp_PayReceiptItems PayReceiptItem	on PayReceiptItem.FinancialItem_Cheque = Cheque.ID
			left join rp_PayReceipts PayReceipt	on PayReceipt.ID = PayReceiptItem.PayReceipt
			left join afw_OptionSetItems ChequeStatusOptionSetItem on ChequeStatusOptionSetItem.ID = Cheque.ChequeStatus
			left join rp_ChequeTags ChequeTag on ChequeTag.ID = Cheque.ChequeTag
go

afw.BeforeAlterView 'rp_HavalePardakhtiView'
go
alter view rp_HavalePardakhtiView as
	select Havale.ID,
		Havale.BankAccount,
		Havale.ShomareHavale,
		Havale.Payee,
		Payee.FullName Payee_FullName,
		BankAccount.AccountNumber BankAccount_Number,
		BankAccount.Code BankAccount_Code,
		BankAccount.Title BankAccount_Title,
		Havale.Amount,
		Havale.SharheHavale
	from rp_HavalePardakhti Havale
		inner join cmn_PersonsView Payee on Payee.ID = Havale.Payee
		inner join cmn_BankAccounts BankAccount on BankAccount.ID = Havale.BankAccount			
go

afw.BeforeAlterView 'rp_NaghdePardakhtiView'
go
alter view rp_NaghdePardakhtiView as
	select Naghd.ID,
		Naghd.Payee,
		Cash.Code Cash_Code,
		Cash.Title Cash_Title,
		Payee.FullName Payee_FullName,
		Naghd.Amount,
		Naghd.SharheNaghd,
		Cash.CashOwnerPerson
	from rp_NaghdePardakhti Naghd
		inner join cmn_PersonsView Payee on Payee.ID = Naghd.Payee
		inner join rp_Cashs Cash on Cash.ID = Naghd.Cash		
go

afw.BeforeAlterView 'rp_ChekeZemanatePardakhtiView'
go
alter view rp_ChekeZemanatePardakhtiView as
	select ChekeZemanat.ID, ChekeZemanat.CreatorUser, ChekeZemanat.CreationTime, ChekeZemanat.LastModifierUser,
		ChekeZemanat.LastModifyTime, ChekeZemanat.OwnerUser, ChekeZemanat.BankAccount, ChekeZemanat.Payee,
		ChekeZemanat.DueDate, ChekeZemanat.Amount, ChekeZemanat.SharheChekeZemanat, ChekeZemanat.DocImage ,
		afw.GregorianToPersian(ChekeZemanat.DueDate) DueDate_Persian,
		Payee.FullName Payee_FullName,
		BankAccount.AccountNumber BankAccount_Number,
		BankAccount.Code BankAccount_Code,
		BankAccount.Title BankAccount_Title
	from rp_ChekeZemanatePardakhti ChekeZemanat
		inner join cmn_PersonsView Payee on Payee.ID = ChekeZemanat.Payee
		inner join cmn_BankAccounts BankAccount on BankAccount.ID = ChekeZemanat.BankAccount		
go

afw.BeforeAlterView 'rp_PayReceiptItemsView'
go
alter view rp_PayReceiptItemsView as
	select PayReceiptItem.ID, PayReceiptItem.CreatorUser, PayReceiptItem.CreationTime, PayReceiptItem.LastModifierUser,
		PayReceiptItem.LastModifyTime, PayReceiptItem.OwnerUser, PayReceiptItem.PayType, PayReceiptItem.FinancialOpKind,
		PayReceiptItem.PayReceipt, PayReceiptItem.FinancialItem_Cheque, PayReceiptItem.FinancialItem_Havale, 
		PayReceiptItem.FinancialItem_Naghd, PayReceiptItem.FinancialItem_ChekeZemanat, 
		PayType.Title PayType_Title,
		case when PayType.Name = 'Cheque' then Cheque.Payee
			when PayType.Name = 'Havale' then Havale.Payee
			when PayType.Name = 'Naghd' then Naghd.Payee
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Payee
		end Payee,
		case when PayType.Name = 'Cheque' then Cheque.Payee_FullName
			when PayType.Name = 'Havale' then Havale.Payee_FullName
			when PayType.Name = 'Naghd' then Naghd.Payee_FullName
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Payee_FullName
		end Payee_FullName,
		case when PayType.Name = 'Cheque' then Cheque.ChequeNumber
			when PayType.Name = 'Havale' then Havale.ShomareHavale
		end ItemNo,
		case when PayType.Name = 'Cheque' then afw.GregorianToPersian(Cheque.DueDate)
			when PayType.Name = 'ChekeZemanat' then afw.GregorianToPersian(ChekeZemanat.DueDate)
		end DueDate,
		case when PayType.Name = 'Cheque' then Cheque.BankAccount_Number
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.BankAccount_Number
			when PayType.Name = 'Havale' then Havale.BankAccount_Number
		end BankAccount_Number,
		case when PayType.Name = 'Cheque' then Cheque.BankAccount_Code
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.BankAccount_Code
			when PayType.Name = 'Havale' then Havale.BankAccount_Code
		end BankAccount_Code,
		case when PayType.Name = 'Cheque' then Cheque.BankAccount_Title
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.BankAccount_Title
			when PayType.Name = 'Havale' then Havale.BankAccount_Title
		end BankAccount_Title,
		Naghd.Cash_Code Cash_Code,
		Naghd.Cash_Title Cash_Title,
		case when PayType.Name = 'Cheque' then Cheque.Amount
			when PayType.Name = 'Havale' then Havale.Amount
			when PayType.Name = 'Naghd' then Naghd.Amount
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
		end Amount,
		case when PayType.Name = 'Cheque' then Cheque.ChequeDescription
			when PayType.Name = 'Havale' then Havale.SharheHavale
			when PayType.Name = 'Naghd' then Naghd.SharheNaghd
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.SharheChekeZemanat
		end ItemDescription,
		PayReceiptItem.DebtorAccount, PayReceiptItem.CreditorAccount, 
		case when PayReceiptItem.FinancialOpKind is null then N'انتخاب از کدینگ حسابداری' 
			else FinancialOpKind.Title
			end Title,
		DebtorAccount.CodeAndName DebtorAccount_Text, CreditorAccount.CodeAndName CreditorAccount_Text,
		case when PayType.Name = 'Naghd' then PayReceiptItem.Creditor_Person end CashOwnerPerson, 
		PayReceiptItem.Debtor_CostCenter, PayReceiptItem.Debtor_Project
	from rp_PayReceiptItems PayReceiptItem
		inner join rp_PayTypes PayType on PayReceiptItem.PayType = PayType.ID
		left join rp_PaidChequesView Cheque on Cheque.ID = PayReceiptItem.FinancialItem_Cheque
		left join rp_HavalePardakhtiView Havale on Havale.ID = PayReceiptItem.FinancialItem_Havale
		left join rp_NaghdePardakhtiView Naghd on Naghd.ID = PayReceiptItem.FinancialItem_Naghd
		left join rp_ChekeZemanatePardakhtiView ChekeZemanat on ChekeZemanat.ID = PayReceiptItem.FinancialItem_ChekeZemanat
		left join rp_FinancialOpKinds FinancialOpKind on FinancialOpKind.ID = PayReceiptItem.FinancialOpKind
		left join acc_AccountsView DebtorAccount on DebtorAccount.ID = PayReceiptItem.DebtorAccount
		left join acc_AccountsView CreditorAccount on CreditorAccount.ID = PayReceiptItem.CreditorAccount
go		

afw.BeforeAlterView 'rp_ReceiveReportView'
go
alter view rp_ReceiveReportView as
	select ReceiveReceiptItem.ReceiveType,
		ReceiveType.Title ReceiveType_Title,
		case when ReceiveType.Name = 'Cheque' then Cheque.RadifeDaftareChek
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.RadifeDaftareChek
		end RadifeDaftareChek,
		case when ReceiveType.Name = 'Cheque' then Cheque.Payer
			when ReceiveType.Name = 'Safte' then Safte.Payer
			when ReceiveType.Name = 'Havale' then Havale.Payer
			when ReceiveType.Name = 'Naghd' then Naghd.Payer
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Payer
		end Payer,
		case when ReceiveType.Name = 'Cheque' then Cheque.Payer_FullName
			when ReceiveType.Name = 'Safte' then Safte.Payer_FullName
			when ReceiveType.Name = 'Havale' then Havale.Payer_FullName
			when ReceiveType.Name = 'Naghd' then Naghd.Payer_FullName
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Payer_FullName
		end Payer_FullName,
		case when ReceiveType.Name = 'Cheque' then Cheque.ChequeNumber
			when ReceiveType.Name = 'Safte' then Safte.ShomareSafte
			when ReceiveType.Name = 'Havale' then Havale.ShomareHavale
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Number
		end ItemNo,
		case when ReceiveType.Name = 'Cheque' then Cheque.DueDate
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.DueDate
		end DueDate,
		case when ReceiveType.Name = 'Cheque' then afw.GregorianToPersian(Cheque.DueDate)
			when ReceiveType.Name = 'ChekeZemanat' then afw.GregorianToPersian(ChekeZemanat.DueDate)
		end DueDate_Persian,
		case when ReceiveType.Name = 'Cheque' then Cheque.Bank_Name
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Bank_Name
		end Bank_Name,
		Cheque.ChequeStatus,
		Cheque.ChequeStatus_Text,
		Cheque.ID Cheque_ID,
		Havale.BankAccount Havale_BankAccount,
		Havale.BankAccount_AccountNumber + '-' + Havale.BankAccount_Title Havale_BankAccount_Text,
		Naghd.Cash_Code Cash_Code,
		Naghd.Cash_Title Cash_Title,
		case when ReceiveType.Name = 'Cheque' then Cheque.Amount
			when ReceiveType.Name = 'Safte' then Safte.Amount
			when ReceiveType.Name = 'Havale' then Havale.Amount
			when ReceiveType.Name = 'Naghd' then Naghd.Amount
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
		end Amount,
		case when ReceiveType.Name = 'Cheque' then Cheque.Description
			when ReceiveType.Name = 'Safte' then Safte.Description
			when ReceiveType.Name = 'Havale' then Havale.Description
			when ReceiveType.Name = 'Naghd' then Naghd.Description
			when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Description
		end ReceiveDocDescription,
		ReceiveReceipt.ID ReceiveReceipt_ID,
		ReceiveReceipt.ReceiptNumber ReceiveReceipt_Number, 
		ReceiveReceipt.ReceiptDate ReceiveReceipt_Date,
		afw.GregorianToPersian(ReceiveReceipt.ReceiptDate) ReceiveReceipt_PersianDate,
		ReceiveReceiptPayer.FullName ReceiveReceipt_PayerFullName, 
		ReceiveReceipt.TotalAmount ReceiveReceipt_TotalAmount,
		AccDoc.DocNo AccDoc_No, Cheque.ChequeTag_Text, Cheque.Note,
		ReceiveReceipt.FinancialDocType,
		FinancialDocType.Title FinancialDocType_Title
	from rp_ReceiveReceiptItems ReceiveReceiptItem
		left join rp_ReceiveReceipts ReceiveReceipt on ReceiveReceipt.ID = ReceiveReceiptItem.ReceiveReceipt
		left join cmn_PersonsView ReceiveReceiptPayer on ReceiveReceiptPayer.ID = ReceiveReceipt.Payer
		left join acc_AccDocs AccDoc on AccDoc.ID = ReceiveReceipt.AccDoc
		left join rp_ReceiveTypes ReceiveType on ReceiveReceiptItem.ReceiveType = ReceiveType.ID
		left join rp_ReceivedChequesView Cheque on Cheque.ID = ReceiveReceiptItem.FinancialItem_Cheque
		left join rp_SafteDaryaftiView Safte on Safte.ID = ReceiveReceiptItem.FinancialItem_Safte
		left join rp_HavaleDaryaftiView Havale on Havale.ID = ReceiveReceiptItem.FinancialItem_Havale
		left join rp_NaghdeDaryaftiView Naghd on Naghd.ID = ReceiveReceiptItem.FinancialItem_Naghd
		left join rp_ChekeZemanateDaryaftiView ChekeZemanat on ChekeZemanat.ID = ReceiveReceiptItem.FinancialItem_ChekeZemanat
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = ReceiveReceipt.FinancialDocType
go

afw.BeforeAlterView 'rp_PayReportView'
go
alter view rp_PayReportView as
	select PayReceiptItem.PayType,
		PayType.Title PayType_Title,
		case when PayType.Name = 'Cheque' then Cheque.Payee
			when PayType.Name = 'Havale' then Havale.Payee
			when PayType.Name = 'Naghd' then Naghd.Payee
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Payee
		end Payee,
		case when PayType.Name = 'Cheque' then Cheque.Payee_FullName
			when PayType.Name = 'Havale' then Havale.Payee_FullName
			when PayType.Name = 'Naghd' then Naghd.Payee_FullName
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Payee_FullName
		end Payee_FullName,
		case when PayType.Name = 'Cheque' then Cheque.ChequeNumber
			when PayType.Name = 'Havale' then Havale.ShomareHavale
		end ItemNo,
		case when PayType.Name = 'Cheque' then Cheque.DueDate
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.DueDate
		end DueDate,
		case when PayType.Name = 'Cheque' then afw.GregorianToPersian(Cheque.DueDate)
			when PayType.Name = 'ChekeZemanat' then afw.GregorianToPersian(ChekeZemanat.DueDate)
		end DueDate_Persian,	
		Cheque.ChequeStatus,
		Cheque.ChequeStatus_Text,
		case when PayType.Name = 'Cheque' then Cheque.BankAccount
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.BankAccount
			when PayType.Name = 'Havale' then Havale.BankAccount
		end BankAccount,
		case when PayType.Name = 'Cheque' then Cheque.BankAccount_Number + '-' + Cheque.BankAccount_Title
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.BankAccount_Number + '-' + ChekeZemanat.BankAccount_Title
			when PayType.Name = 'Havale' then Havale.BankAccount_Number + '-' + Havale.BankAccount_Title
		end BankAccount_Text,
		Naghd.Cash_Code Cash_Code,
		Naghd.Cash_Title Cash_Title,
		case when PayType.Name = 'Cheque' then Cheque.Amount
			when PayType.Name = 'Havale' then Havale.Amount
			when PayType.Name = 'Naghd' then Naghd.Amount
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
		end Amount,
		case when PayType.Name = 'Cheque' then Cheque.ChequeDescription
			when PayType.Name = 'Havale' then Havale.SharheHavale
			when PayType.Name = 'Naghd' then Naghd.SharheNaghd
			when PayType.Name = 'ChekeZemanat' then ChekeZemanat.SharheChekeZemanat
		end PayDocDescription,
		PayReceipt.ID PayReceipt_ID,
		PayReceipt.ReceiptNumber PayReceipt_Number, 
		PayReceipt.ReceiptDate PayReceipt_Date,
		afw.GregorianToPersian(PayReceipt.ReceiptDate) PayReceipt_PersianDate,
		PayReceiptPayee.FullName PayReceipt_PayeeFullName, 
		PayReceipt.TotalAmount PayReceipt_TotalAmount,
		AccDoc.DocNo AccDoc_No, Cheque.ChequeTag_Text, Cheque.Note,
		PayReceipt.FinancialDocType,
		FinancialDocType.Title FinancialDocType_Title
	from rp_PayReceiptItems PayReceiptItem
		left join rp_PayReceipts PayReceipt on PayReceipt.ID = PayReceiptItem.PayReceipt
		left join cmn_PersonsView PayReceiptPayee on PayReceiptPayee.ID = PayReceipt.Payee
		left join acc_AccDocs AccDoc on AccDoc.ID = PayReceipt.AccDoc
		left join rp_PayTypes PayType on PayReceiptItem.PayType = PayType.ID
		left join rp_PaidChequesView Cheque on Cheque.ID = PayReceiptItem.FinancialItem_Cheque
		left join rp_HavalePardakhtiView Havale on Havale.ID = PayReceiptItem.FinancialItem_Havale
		left join rp_NaghdePardakhtiView Naghd on Naghd.ID = PayReceiptItem.FinancialItem_Naghd
		left join rp_ChekeZemanatePardakhtiView ChekeZemanat on ChekeZemanat.ID = PayReceiptItem.FinancialItem_ChekeZemanat
		left join afw_OptionSetItems FinancialDocType on FinancialDocType.ID = PayReceipt.FinancialDocType
go

afw.BeforeAlterView 'rp_ReceivedChequeStatusChangesView'
go
alter view rp_ReceivedChequeStatusChangesView as 
	select ChequeStatusChange.*,
		Cheque.ChequeNumber ChequeNumber,
		Cheque.Amount Cheque_Amount,
		OptionSetItem.Title NewStatus_Text,
		PreviousStatusOptionSetItem.Title PreviousStatus_Text,
		afw.GregorianToPersian(ChequeStatusChange.ChangeDate) ChangeDate_Persian,
		Person.FullName Person_FullName,
		BankAccount.Title + ' - ' + BankAccount.AccountNumber BankAccount_Text,
		afw.GregorianToPersian(ChequeStatusChange.CreationTime) CreationTime_Persian,
		CreatorUser.DisplayName CreatorUser_Name, 
		ReceiveReceipt.ReceiptNumber, 
		ReceiveReceipt.ReceiptDate,
		afw.GregorianToPersian(ReceiveReceipt.ReceiptDate) ReceiptDate_Persian,
		Bank.Name Bank_Name, 
		Payer.FullName Payer_FullName, 
		Cheque.DueDate,
		afw.GregorianToPersian(Cheque.DueDate) DueDate_Persian,
		ReceiveReceiptItem.ID Cheque_ReceiveReceiptItemID,
		AccDoc.DocNo AccDoc_No
	from rp_ReceivedChequeStatusChanges ChequeStatusChange
		inner join rp_ReceivedCheques Cheque on Cheque.ID = ChequeStatusChange.Cheque
		inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus
		left join rp_ReceivedChequeStatusChanges PreviousChequeStatusChange on PreviousChequeStatusChange.ID = ChequeStatusChange.PreviousStatusChange
		left join afw_OptionSetItems PreviousStatusOptionSetItem on PreviousStatusOptionSetItem.ID = PreviousChequeStatusChange.NewStatus
		left join cmn_PersonsView Person on Person.ID = ChequeStatusChange.Person
		left join cmn_BankAccounts BankAccount on BankAccount.ID = ChequeStatusChange.BankAccount
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = ChequeStatusChange.CreatorUser
		left join rp_ReceiveReceiptItems ReceiveReceiptItem	on ReceiveReceiptItem.FinancialItem_Cheque = Cheque.ID
		left join rp_ReceiveReceipts ReceiveReceipt	on ReceiveReceipt.ID = ReceiveReceiptItem.ReceiveReceipt
		left join cmn_Banks Bank on Bank.ID = Cheque.Bank
		left join cmn_PersonsView Payer on Payer.ID = Cheque.Payer
		left join acc_AccDocs AccDoc on AccDoc.ID = ChequeStatusChange.AccDoc 
			or (AccDoc.ID = ReceiveReceipt.AccDoc and ChequeStatusChange.PreviousStatusChange is null)
go

afw.BeforeAlterView 'rp_PaidChequeStatusChangesView'
go
alter view rp_PaidChequeStatusChangesView as
	select ChequeStatusChange.ID, ChequeStatusChange.CreatorUser, ChequeStatusChange.CreationTime, ChequeStatusChange.LastModifierUser,
		ChequeStatusChange.LastModifyTime, ChequeStatusChange.OwnerUser, ChequeStatusChange.NewStatus, ChequeStatusChange.ChangeDate,
		ChequeStatusChange.Description, ChequeStatusChange.Cheque, ChequeStatusChange.AccDoc, ChequeStatusChange.FinancialYear, 
		ChequeStatusChange.FinancialGroup, ChequeStatusChange.PreviousStatusChange,
		Cheque.ChequeNumber ChequeNumber,
		Cheque.Amount Cheque_Amount,
		OptionSetItem.Title NewStatus_Text,
		PreviousStatusOptionSetItem.Title PreviousStatus_Text,
		afw.GregorianToPersian(ChequeStatusChange.ChangeDate) ChangeDate_Persian,
		afw.GregorianToPersian(ChequeStatusChange.CreationTime) CreationTime_Persian,
		SystemUser.Name CreatorUser_Name, PayReceipt.ReceiptNumber, PayReceipt.ReceiptDate,
		afw.GregorianToPersian(PayReceipt.ReceiptDate) ReceiptDate_Persian,
		BankAccount.Title + ' - ' + BankAccount.AccountNumber BankAccount_Text,
		afw.GregorianToPersian(Cheque.DueDate) DueDate_Persian, Cheque.DueDate,
		Payee.FullName Payee_FullName,
		PayReceiptItem.ID Cheque_PayReceiptItemID,
		AccDoc.DocNo AccDoc_No
	from rp_PaidChequeStatusChanges ChequeStatusChange
		inner join rp_PaidCheques Cheque on Cheque.ID = ChequeStatusChange.Cheque
		inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus
		left join rp_PaidChequeStatusChanges PreviousChequeStatusChange on PreviousChequeStatusChange.ID = ChequeStatusChange.PreviousStatusChange
		left join afw_OptionSetItems PreviousStatusOptionSetItem on PreviousStatusOptionSetItem.ID = PreviousChequeStatusChange.NewStatus
		left join afw_SystemUsers SystemUser on SystemUser.ID = ChequeStatusChange.CreatorUser
		left join rp_PayReceiptItems PayReceiptItem	on PayReceiptItem.FinancialItem_Cheque = Cheque.ID
		left join rp_PayReceipts PayReceipt	on PayReceipt.ID = PayReceiptItem.PayReceipt
		left join cmn_BankAccounts BankAccount on BankAccount.ID = Cheque.BankAccount
		left join cmn_PersonsView Payee on Payee.ID = Cheque.Payee
		left join acc_AccDocs AccDoc on AccDoc.ID = ChequeStatusChange.AccDoc 
			or (AccDoc.ID = PayReceipt.AccDoc and ChequeStatusChange.PreviousStatusChange is null)
go


afw.BeforeAlterProc 'rp.CreateReceiveReceiptDocItems'
go
alter Procedure [rp].[CreateReceiveReceiptDocItems]
	@ReceiveReceiptID uniqueidentifier,
	@AccDocID uniqueidentifier,
	@CreatorUser uniqueidentifier
	
as
begin

/*آیتم های سند را در صورت وجود، پاک می کند***********************/
	delete from acc_AccDocItems 
	where AccDoc = @AccDocID and 
		RefOp_ReceiveReceipt = @ReceiveReceiptID
	
/*ثبت آیتم های سند***************************/
	
	declare @CountRow int , @i int
	declare @RowNo int, @ReceiveReceiptItemID uniqueidentifier, @PersonID uniqueidentifier	
	declare @CreditorAccount uniqueidentifier, @DebtorAccount uniqueidentifier
	declare @FinancialYearID uniqueidentifier, @Amount int, @Desc nvarchar(200)
	
	select @FinancialYearID = FinancialYear 
	from rp_ReceiveReceipts 	
	where ID = @ReceiveReceiptID
		
	
	SELECT *
	into #ReceiveReceiptItems
	FROM rp_ReceiveReceiptItemsView ReceiveReceiptItem
		where ReceiveReceiptItem.ReceiveReceipt = @ReceiveReceiptID

	set @i = 1
	set @RowNo = 1

	select @CountRow = Count(*) 
	From #ReceiveReceiptItems	
		
	while @i <= @CountRow
	begin
	
	set @ReceiveReceiptItemID = (
										 select  top 1 ID
										 FROM  #ReceiveReceiptItems
								)
								
	select @CreditorAccount = FinancialOpKindAccSetting.CreditorAccount,
		@DebtorAccount = FinancialOpKindAccSetting.DebtorAccount 
	from rp_ReceiveReceiptItems ReceiveReceiptItem
		inner join rp_FinancialOpKindAccSettings FinancialOpKindAccSetting on FinancialOpKindAccSetting.FinancialOpKind = ReceiveReceiptItem.FinancialOpKind
	where ReceiveReceiptItem.ID = @ReceiveReceiptItemID and FinancialOpKindAccSetting.FinancialYear = @FinancialYearID							
	
	select @Desc = ItemDescription,
		@Amount = Amount,
		@PersonID = Payer
	FROM #ReceiveReceiptItems
	where ID = @ReceiveReceiptItemID
	
	/*بدهکار************************/
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   IsActive, RefOp_ReceiveReceipt
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, @RowNo, @DebtorAccount, @Desc, 0, @Amount,
				   1, @ReceiveReceiptID
				   )

			select @RowNo = @RowNo + 1

	/*بستانکار*******************************/			
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   Person, IsActive, RefOp_ReceiveReceipt
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, @RowNo, @CreditorAccount, @Desc, @Amount, 0,
				   @PersonID, 1, @ReceiveReceiptID
				   )
				   
			select @RowNo = @RowNo + 1

			delete From #ReceiveReceiptItems Where ID = @ReceiveReceiptItemID
			
			select @i = @i + 1

	end
/*****************************************************/	

drop table #ReceiveReceiptItems

end
go

afw.BeforeAlterProc 'rp.CreatePayReceiptDocItems'
go
alter Procedure [rp].[CreatePayReceiptDocItems]
	@PayReceiptID uniqueidentifier,
	@AccDocID uniqueidentifier,
	@CreatorUser uniqueidentifier
	
as
begin

/*آیتم های سند را در صورت وجود، پاک می کند***********************/
	delete from acc_AccDocItems 
	where AccDoc = @AccDocID and 
		RefOp_PayReceipt = @PayReceiptID
	
/*ثبت آیتم های سند***************************/
	
	declare @CountRow int , @i int
	declare @RowNo int, @PayReceiptItemID uniqueidentifier, @PersonID uniqueidentifier
	declare @CreditorAccount uniqueidentifier, @DebtorAccount uniqueidentifier
	declare @FinancialYearID uniqueidentifier, @Amount int, @Desc nvarchar(200)
	
	select @FinancialYearID = FinancialYear 
	from rp_PayReceipts 	
	where ID = @PayReceiptID
		
	
	SELECT *
	into #PayReceiptItems
	FROM rp_PayReceiptItemsView PayReceiptItem
		where PayReceiptItem.PayReceipt = @PayReceiptID

	set @i = 1
	set @RowNo = 1

	select @CountRow = Count(*) 
	From #PayReceiptItems	
		
	while @i <= @CountRow
	begin
	
	set @PayReceiptItemID = (
										 select  top 1 ID
										 FROM  #PayReceiptItems
								)
								
	select @CreditorAccount = FinancialOpKindAccSetting.CreditorAccount,
		@DebtorAccount = FinancialOpKindAccSetting.DebtorAccount 
	from rp_PayReceiptItems PayReceiptItem
		inner join rp_FinancialOpKindAccSettings FinancialOpKindAccSetting on FinancialOpKindAccSetting.FinancialOpKind = PayReceiptItem.FinancialOpKind
	where PayReceiptItem.ID = @PayReceiptItemID and FinancialOpKindAccSetting.FinancialYear = @FinancialYearID							
	
	select @Desc = ItemDescription,
		@Amount = Amount,
		@PersonID = Payee
	FROM #PayReceiptItems
	where ID = @PayReceiptItemID
	
	/*بدهکار************************/
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   Person, IsActive, RefOp_PayReceipt
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, @RowNo, @DebtorAccount, @Desc, 0, @Amount,
				   @PersonID, 1, @PayReceiptID
				   )

			select @RowNo = @RowNo + 1

	/*بستانکار*******************************/			
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   IsActive, RefOp_PayReceipt
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, @RowNo, @CreditorAccount, @Desc, @Amount, 0,
				   1, @PayReceiptID
				   )
				   
			select @RowNo = @RowNo + 1

			delete From #PayReceiptItems Where ID = @PayReceiptItemID
			
			select @i = @i + 1

	end
/*****************************************************/	

drop table #PayReceiptItems

end
go

afw.BeforeAlterProc 'rp.CreatePaidChequeTransferDocItems'
go
ALTER Procedure [rp].[CreatePaidChequeTransferDocItems]
	@PaidChequeStatusChangeID uniqueidentifier,
	@AccDocID uniqueidentifier,
	@CreatorUser uniqueidentifier
	
as
begin

/*آیتم های سند را در صورت وجود، پاک می کند***********************/
	delete from acc_AccDocItems 
	where AccDoc = @AccDocID and 
		RefOp_PaidChequeStatusChange = @PaidChequeStatusChangeID
	
/*ثبت آیتم های سند***************************/
	
	declare @NewStatusID uniqueidentifier, @Cheque uniqueidentifier, @PreviousChequeStatusChangeID uniqueidentifier	
	declare @CreditorAccount uniqueidentifier, @DebtorAccount uniqueidentifier, @PreviousStatusID uniqueidentifier
	declare @PreviousFinancialYearID uniqueidentifier, @NewFinancialYearID uniqueidentifier
	declare @PreviousStatus_Name varchar(100), @NewStatus_Name varchar(100), @Amount int, @Desc nvarchar(200)
	
	select @Cheque = ChequeStatusChange.Cheque,
		@Desc = ChequeStatusChange.Description,
		@Amount = PaidCheque.Amount,
		@NewFinancialYearID = ChequeStatusChange.FinancialYear,
		@NewStatusID = ChequeStatusChange.NewStatus,
		@NewStatus_Name = OptionSetItem.Name  
	from rp_PaidChequeStatusChanges ChequeStatusChange	
		inner join rp_PaidCheques PaidCheque on PaidCheque.ID = ChequeStatusChange.Cheque
		inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus
	where ChequeStatusChange.ID = @PaidChequeStatusChangeID
					
	--set @PreviousChequeStatusChangeID = (
	--										select top 1 ID
	--										from rp_PaidChequeStatusChanges PaidChequeStatusChange		
	--										where Cheque = @Cheque and ID <> @PaidChequeStatusChangeID
	--										order by CreationTime desc	
	--								     )			
									     
 --   select @PreviousStatusID = NewStatus,
	--	@PreviousStatus_Name = OptionSetItem.Name,
	--	@PreviousFinancialYearID = FinancialYear 
 --   from rp_PaidChequeStatusChanges ChequeStatusChange	
	--	inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus	
	--where ChequeStatusChange.ID = @PreviousChequeStatusChangeID 
							
	select @CreditorAccount = BankAccount.AccountInCoding 
	from rp_PaidChequeStatusChanges ChequeStatusChange
		inner join rp_PaidCheques Cheque on Cheque.ID = ChequeStatusChange.Cheque
		inner join cmn_BankAccounts BankAccount on BankAccount.ID = Cheque.BankAccount
	where ChequeStatusChange.ID = @PaidChequeStatusChangeID		     
    
    select @DebtorAccount = AccountInCoding 
	from rp_ChequeStatusChangeAccSettings 
    where PaidChequeStatus = @NewStatusID and FinancialYear = @NewFinancialYearID  
	
	/*بدهکار************************/
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   IsActive, RefOp_PaidChequeStatusChange
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, 1, @DebtorAccount, @Desc, 0, @Amount,
				   1, @PaidChequeStatusChangeID
				   )			

	/*بستانکار*******************************/			
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   IsActive, RefOp_PaidChequeStatusChange
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, 2, @CreditorAccount, @Desc, @Amount, 0,
				   1, @PaidChequeStatusChangeID
				   )
	
/*****************************************************/	

end
go

afw.BeforeAlterProc 'rp.CreateReceivedChequeTransferDocItems'
go
ALTER Procedure [rp].[CreateReceivedChequeTransferDocItems]
	@ReceivedChequeStatusChangeID uniqueidentifier,
	@AccDocID uniqueidentifier,
	@CreatorUser uniqueidentifier
	
as
begin

/*آیتم های سند را در صورت وجود، پاک می کند***********************/
	delete from acc_AccDocItems 
	where AccDoc = @AccDocID and 
		RefOp_ReceivedChequeStatusChange = @ReceivedChequeStatusChangeID
	
/*ثبت آیتم های سند***************************/
	
	declare @NewStatusID uniqueidentifier, @Cheque uniqueidentifier, @PreviousChequeStatusChangeID uniqueidentifier	
	declare @PreviousStatusChange_PersonID uniqueidentifier, @NewStatusChange_PersonID uniqueidentifier
	declare @PreviousStatus_Name varchar(100), @NewStatus_Name varchar(100), @Amount int, @Desc nvarchar(200) 
	declare @CreditorAccount uniqueidentifier, @DebtorAccount uniqueidentifier, @PreviousStatusID uniqueidentifier
	declare @PreviousFinancialYearID uniqueidentifier, @NewFinancialYearID uniqueidentifier
		
	select @Cheque = ChequeStatusChange.Cheque,
		@Desc = ChequeStatusChange.Description,
		@Amount = ReceivedCheque.Amount,
		@NewStatusChange_PersonID = ChequeStatusChange.Person,
		@NewFinancialYearID = ChequeStatusChange.FinancialYear,
		@NewStatusID = ChequeStatusChange.NewStatus,
		@NewStatus_Name = OptionSetItem.Name 
	from rp_ReceivedChequeStatusChanges ChequeStatusChange	
		inner join rp_ReceivedCheques ReceivedCheque on ReceivedCheque.ID = ChequeStatusChange.Cheque
		inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus
	where ChequeStatusChange.ID = @ReceivedChequeStatusChangeID
					
	set @PreviousChequeStatusChangeID = (
											select top 1 ID
											from rp_ReceivedChequeStatusChanges ReceivedChequeStatusChange		
											where Cheque = @Cheque and ID <> @ReceivedChequeStatusChangeID
											order by CreationTime desc	
									     )			
									     
    select @PreviousStatusID = NewStatus,
		@PreviousStatus_Name = OptionSetItem.Name,
		@PreviousStatusChange_PersonID = Person,
		@PreviousFinancialYearID = FinancialYear	 
    from rp_ReceivedChequeStatusChanges ChequeStatusChange
		inner join afw_OptionSetItems OptionSetItem on OptionSetItem.ID = ChequeStatusChange.NewStatus    		
	where ChequeStatusChange.ID = @PreviousChequeStatusChangeID 
	
	if @PreviousStatus_Name = 'VosoolShode'
	begin
	
	select @CreditorAccount = BankAccount.AccountInCoding 
	from rp_ReceivedChequeStatusChanges ChequeStatusChange
		left join cmn_BankAccounts BankAccount on BankAccount.ID = ChequeStatusChange.BankAccount
	where ChequeStatusChange.ID = @PreviousChequeStatusChangeID
	
	end
	else
	begin
	
	select @CreditorAccount = AccountInCoding 
	from rp_ChequeStatusChangeAccSettings 
    where ReceivedChequeStatus = @PreviousStatusID and FinancialYear = @PreviousFinancialYearID 
    
	end
	
	if @NewStatus_Name = 'VosoolShode'
	begin
	
	select @DebtorAccount = BankAccount.AccountInCoding 
	from rp_ReceivedChequeStatusChanges ChequeStatusChange
		left join cmn_BankAccounts BankAccount on BankAccount.ID = ChequeStatusChange.BankAccount
	where ChequeStatusChange.ID = @ReceivedChequeStatusChangeID					
	
	end
	else
	begin
	
    select @DebtorAccount = AccountInCoding 
	from rp_ChequeStatusChangeAccSettings 
    where ReceivedChequeStatus = @NewStatusID and FinancialYear = @NewFinancialYearID 
    
    end  
	
	/*بدهکار************************/
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   Person, IsActive, RefOp_ReceivedChequeStatusChange
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, 1, @DebtorAccount, @Desc, 0, @Amount,
				   @NewStatusChange_PersonID, 1, @ReceivedChequeStatusChangeID
				   )			

	/*بستانکار*******************************/			
			INSERT INTO acc_AccDocItems
				   (
				   ID, CreatorUser, CreationTime, AccDoc, RowNo, Account, Note, CreditorAmount, DebtorAmount, 
				   Person, IsActive, RefOp_ReceivedChequeStatusChange
				   )
			VALUES(
				   NEWID(), @CreatorUser, GETDATE(), @AccDocID, 2, @CreditorAccount, @Desc, @Amount, 0,
				   @PreviousStatusChange_PersonID, 1, @ReceivedChequeStatusChangeID
				   )
	
/*****************************************************/	

end
go

afw.BeforeAlterProc 'rp.CopyFinancialYearSettings'
go

alter procedure rp.CopyFinancialYearSettings
	@SourceFinancialYear uniqueidentifier, @DestinationFinancialYear uniqueidentifier as
begin

	--عملیات مالی خزانه
	insert into rp_FinancialOpKindAccSettings(ID,
		FinancialYear,
		FinancialOpKind	,
		CreditorAccount,
		DebtorAccount	
		)
	select NEWID(),
		@DestinationFinancialYear,			
		FinancialOpKind,		
		(select ID from acc_Accounts 
		 where SourceAccount = CreditorAccount and
			FinancialYear = @DestinationFinancialYear),
		(select ID from acc_Accounts 
		 where SourceAccount = DebtorAccount and
			FinancialYear = @DestinationFinancialYear)
	from rp_FinancialOpKindAccSettings
	where FinancialYear = @SourceFinancialYear
	
	-- تنظیمات حساب تغییر وضعیت چک
	insert into rp_ChequeStatusChangeAccSettings(ID,
		FinancialYear,
		AccountInCoding,
		ChequeType,
		IsActive,
		PaidChequeStatus,
		ReceivedChequeStatus,
		Title)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts 
		 where SourceAccount = AccountInCoding and
			FinancialYear = @DestinationFinancialYear), 
		ChequeType,
		IsActive,
		PaidChequeStatus,
		ReceivedChequeStatus,
		Title
	from rp_ChequeStatusChangeAccSettings
	where FinancialYear = @SourceFinancialYear
	
	-- تنظیمات حسابداری طرف حساب تنخواه	
	insert into rp_TarafHesabeTankhahAccSettings(ID,
		FinancialYear,
		Account,
		TarafHesabeTankhah)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = Account and
			FinancialYear = @DestinationFinancialYear),
		TarafHesabeTankhah
	from rp_TarafHesabeTankhahAccSettings
	where FinancialYear = @SourceFinancialYear
	
	-- تنظیمات حسابداری صندوق
	insert into rp_CashAccSettings(ID,
		FinancialYear,
		AccountInCoding,
		CashOwnerPerson,
		Cash)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = AccountInCoding and
			FinancialYear = @DestinationFinancialYear),
		CashOwnerPerson,
		Cash
	from rp_CashAccSettings
	where FinancialYear = @SourceFinancialYear
	
	--تنظیمات حسابداری تنخواه گردان ها
	
	insert into rp_TankhahGardanAccSettings(ID,
		FinancialYear,
		Account,
		TankhahGardan,
		OwnerPerson)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = Account and
			FinancialYear = @DestinationFinancialYear),
		TankhahGardan,
		OwnerPerson
	from rp_TankhahGardanAccSettings
	where FinancialYear = @SourceFinancialYear
	
	--تنظیمات حسابداری حسابهای بانکی
	
	insert into cmn_BankAccountAccSettings(ID,
		FinancialYear,
		AccountInCoding,
		HesabeAsnadeDarJaryaneVosool,
		HesabeAsnadePardakhtani,
		HesabeCheqeZemanat,
		BankAccount)
	select NEWID(),
		@DestinationFinancialYear,
		(select ID from acc_Accounts
		 where SourceAccount = AccountInCoding and
			FinancialYear = @DestinationFinancialYear),
		(select ID from acc_Accounts
		 where SourceAccount = HesabeAsnadeDarJaryaneVosool and
			FinancialYear = @DestinationFinancialYear),
		(select ID from acc_Accounts
		 where SourceAccount = HesabeAsnadePardakhtani and
			FinancialYear = @DestinationFinancialYear),
		(select ID from acc_Accounts
		 where SourceAccount = HesabeCheqeZemanat and
			FinancialYear = @DestinationFinancialYear),		
		BankAccount
	from cmn_BankAccountAccSettings
	where FinancialYear = @SourceFinancialYear
end
go
