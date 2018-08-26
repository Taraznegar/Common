--حواله عملیات مونتاژ
insert into wm_GhabzOrHavaleTypes (
	Havale_HasNameTahvilgirandehTarafMoshtari, 
	CanDecreaseItemsCount, 
	CreationTime, 
	NahveRialiNemodan, 
	CanRemoveItems, 
	WarehouseDocType, 
	MasterBatchNumber, 
	Havale_HasNameTahvilgirandehAzAnbar, 
	Havale_HasSendTime, 
	Havale_CheckStuffStock, 
	Havale_HasTelephoneTahvilgirandehTarafeMoshtari, 
	Stock, 
	Title, 
	Havale_HasTelephoneTahvilgirandehAzAnbar, 
	CanAddItems, 
	IsUserDefined, 
	SetStuffsSerialNumberIsRequiered, 
	Quantity, 
	Havale_HasShomarehBarnameh, 
	Stuff, 
	HasWarehouseKeeperNotes, 
	CanIncreaseItemsCount, 
	Name, 
	HasReferenceDoc, 
	RefDocName, 
	CanIssueAccDoc, 
	Havale_HasSendType, 
	ReferenceDocType, 
	ID, 
	WareHouseDocRialiReferenceType, 
	HasTarafHesab_Person) 
values (
	0, 
	0, 
	N'2018/06/28 10:05:00', 
	'B63FCB01-AF85-4E18-BB4A-0A9009A2AABE',--NahveRialiNemodan:میانگین سیار
	0, 
	N'D8B25D60-9851-48E7-8E90-3D4F039479D7', --WarehouseDocType:حواله
	0, --MasterBatchNumber
	0, 
	0, 
	1, --Havale_CheckStuffStock
	0, 
	0, 
	N'حواله عملیات مونتاژ', 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, --Stuff
	0, 
	0, 
	'HavaleAmaliateMontage', 
	1, 
	'MontageOp', 
	1, 
	0, 
	N'ea979621-3cfe-4fe1-aecf-723f5779a577', --ReferenceDocType: عملیات مونتاژ
	N'168D8F12-FBAC-4E3C-BA69-17F40F36230F', --ID
	null, 
	0)

--رسید عملیات مونتاژ
insert into wm_GhabzOrHavaleTypes (
	Havale_HasNameTahvilgirandehTarafMoshtari, 
	CanDecreaseItemsCount, 
	CreationTime, 
	NahveRialiNemodan, 
	CanRemoveItems, 
	WarehouseDocType, 
	MasterBatchNumber, 
	Havale_HasNameTahvilgirandehAzAnbar, 
	Havale_HasSendTime, 
	Havale_CheckStuffStock, 
	Havale_HasTelephoneTahvilgirandehTarafeMoshtari, 
	Stock, 
	Title, 
	Havale_HasTelephoneTahvilgirandehAzAnbar, 
	CanAddItems, 
	IsUserDefined, 
	SetStuffsSerialNumberIsRequiered, 
	Quantity, 
	Havale_HasShomarehBarnameh, 
	Stuff, 
	HasWarehouseKeeperNotes, 
	CanIncreaseItemsCount, 
	Name, 
	HasReferenceDoc, 
	RefDocName, 
	CanIssueAccDoc, 
	Havale_HasSendType, 
	ReferenceDocType, 
	ID, 
	WareHouseDocRialiReferenceType, 
	HasTarafHesab_Person) 
values (
	0, 
	0, 
	N'2018/06/28 10:05:00', 
	'980443D8-899D-459C-87E2-3F70F7942A18',--NahveRialiNemodan:رسید مونتاژ
	0, 
	N'8b400ad0-36fc-405b-b6c2-29ac8c3f8631', --WarehouseDocType:رسید
	0, --MasterBatchNumber
	0, 
	0, 
	0, 
	0, 
	0, 
	N'رسید عملیات مونتاژ', 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, --Stuff
	0, 
	0, 
	'ResideAmaliateMontage', 
	1, 
	'MontageOp', 
	1, 
	0, 
	N'ea979621-3cfe-4fe1-aecf-723f5779a577', --ReferenceDocType: عملیات مونتاژ
	N'ca0667d7-4549-4434-aed0-d92b75e61593', --ID
	'168D8F12-FBAC-4E3C-BA69-17F40F36230F', --حواله عملیات مونتاژ
	0)

--حواله عملیات دمونتاژ
insert into wm_GhabzOrHavaleTypes (
	Havale_HasNameTahvilgirandehTarafMoshtari, 
	CanDecreaseItemsCount, 
	CreationTime, 
	NahveRialiNemodan, 
	CanRemoveItems, 
	WarehouseDocType, 
	MasterBatchNumber, 
	Havale_HasNameTahvilgirandehAzAnbar, 
	Havale_HasSendTime, 
	Havale_CheckStuffStock, 
	Havale_HasTelephoneTahvilgirandehTarafeMoshtari, 
	Stock, 
	Title, 
	Havale_HasTelephoneTahvilgirandehAzAnbar, 
	CanAddItems, 
	IsUserDefined, 
	SetStuffsSerialNumberIsRequiered, 
	Quantity, 
	Havale_HasShomarehBarnameh, 
	Stuff, 
	HasWarehouseKeeperNotes, 
	CanIncreaseItemsCount, 
	Name, 
	HasReferenceDoc, 
	RefDocName, 
	CanIssueAccDoc, 
	Havale_HasSendType, 
	ReferenceDocType, 
	ID, 
	WareHouseDocRialiReferenceType, 
	HasTarafHesab_Person) 
values (
	0, 
	0, 
	N'2018/06/28 10:05:00', 
	'B63FCB01-AF85-4E18-BB4A-0A9009A2AABE',--NahveRialiNemodan:میانگین سیار
	0, 
	N'D8B25D60-9851-48E7-8E90-3D4F039479D7', --WarehouseDocType:حواله
	0, --MasterBatchNumber
	0, 
	0, 
	1, --Havale_CheckStuffStock
	0, 
	0, 
	N'حواله عملیات دمونتاژ', 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, --Stuff
	0, 
	0, 
	'HavaleAmaliateDemontage', 
	1, 
	'DemontageOp', 
	1, 
	0, 
	N'699D9996-682F-457A-8865-F7B7E5141140', --ReferenceDocType: عملیات دمونتاژ
	N'615C36E4-C7A9-4B79-B521-FD55EA89F754', --ID
	null, 
	0)

--رسید عملیات دمونتاژ
insert into wm_GhabzOrHavaleTypes (
	Havale_HasNameTahvilgirandehTarafMoshtari, 
	CanDecreaseItemsCount, 
	CreationTime, 
	NahveRialiNemodan, 
	CanRemoveItems, 
	WarehouseDocType, 
	MasterBatchNumber, 
	Havale_HasNameTahvilgirandehAzAnbar, 
	Havale_HasSendTime, 
	Havale_CheckStuffStock, 
	Havale_HasTelephoneTahvilgirandehTarafeMoshtari, 
	Stock, 
	Title, 
	Havale_HasTelephoneTahvilgirandehAzAnbar, 
	CanAddItems, 
	IsUserDefined, 
	SetStuffsSerialNumberIsRequiered, 
	Quantity, 
	Havale_HasShomarehBarnameh, 
	Stuff, 
	HasWarehouseKeeperNotes, 
	CanIncreaseItemsCount, 
	Name, 
	HasReferenceDoc, 
	RefDocName, 
	CanIssueAccDoc, 
	Havale_HasSendType, 
	ReferenceDocType, 
	ID, 
	WareHouseDocRialiReferenceType, 
	HasTarafHesab_Person) 
values (
	0, 
	0, 
	N'2018/06/28 10:05:00', 
	'264BF97D-B3F7-4945-A391-8A4109D0F88C',--NahveRialiNemodan:رسید دمونتاژ
	0, 
	N'8b400ad0-36fc-405b-b6c2-29ac8c3f8631', --WarehouseDocType:رسید
	0, --MasterBatchNumber
	0, 
	0, 
	0, 
	0, 
	0, 
	N'رسید عملیات دمونتاژ', 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, 
	0, --Stuff
	0, 
	0, 
	'ResideAmaliateDemontage', 
	1, 
	'DemontageOp', 
	1, 
	0, 
	N'699D9996-682F-457A-8865-F7B7E5141140', --ReferenceDocType: عملیات دمونتاژ
	N'7E282BB7-D243-4AD4-8D29-F66E35A4D31A', --ID
	'615C36E4-C7A9-4B79-B521-FD55EA89F754', --حواله عملیات دمونتاژ
	0)

