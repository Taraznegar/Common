using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class BankAccountBL : EntityBL
    {
        public static class AccAccountNames
        {
            public const string AccountInCoding = "AccountInCoding";
            public const string HesabeAsnadeDarJaryaneVosool = "HesabeAsnadeDarJaryaneVosool";
            public const string HesabeAsnadePardakhtani = "HesabeAsnadePardakhtani";
            public const string HesabeCheqeZemanat = "HesabeCheqeZemanat";
        }

        public Guid GetBankAccountAccAccountID(Guid bankAccountID,Guid financialYearID, string accountName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var bankAccountAccSetting = dbHelper.FetchSingle("cmn.BankAccountAccSetting", 
                string.Format("BankAccount = '{0}' and FinancialYear = '{1}'", bankAccountID, financialYearID), null);

            if (bankAccountAccSetting == null)
                throw new AfwException("حساب بانکی انتخاب شده در سال مالی جاری تنظیمات حسابداری ندارد.");

            if (!bankAccountAccSetting.FieldExists(accountName))
                throw new AfwException("Invalid BankAccount account name!");

            var accountID = bankAccountAccSetting.GetFieldValue<Guid?>(accountName);
            if (accountID == null)
            {
                var accountTitle = "";

                if (accountName == AccAccountNames.AccountInCoding)
                    accountTitle = "حساب در کدینگ";
                else if (accountName == AccAccountNames.HesabeAsnadeDarJaryaneVosool)
                    accountTitle = "حساب اسناد در جریان وصول";
                else if (accountName == AccAccountNames.HesabeAsnadePardakhtani)
                    accountTitle = "حساب اسناد پرداختنی";
                else if (accountName == AccAccountNames.HesabeCheqeZemanat)
                    accountTitle = "حساب چک ضمانت";

                throw new AfwException("در تنظیمات حساب بانکی، {0} مشخص نشده است.", accountTitle);
            }
            else
                return (Guid)accountID;

        }
    }
}
