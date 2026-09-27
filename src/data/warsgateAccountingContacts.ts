import { AccountingContact } from '../api/client';

export const DEFAULT_ACCOUNTING_CUSTOMERS: AccountingContact[] = [
  {
    id: "cont-pnp-1",
    name: "Mr. Patama (คุณปัทมะ จินดาพงษ์)",
    companyName: "บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด",
    taxId: "0205555029622",
    isBranch: false,
    branchCode: "00000",
    address: "91/10 หมู่ที่ 12 ถนนศุขประยูร ตำบลนาป่า อำเภอเมืองชลบุรี จ.ชลบุรี 20000",
    phone: "038-441299, 085-811-6949",
    email: "numpj@hotmail.com",
    type: "CUSTOMER",
    creditDays: 30,
    totalTransactions: 7,
    balanceDue: 1154530
  },
  {
    id: "cont-kuroda-1",
    name: "คุณ นพพล อุ่นม่อน",
    companyName: "บริษัท คูโรดา เทคโน ทูลลิง แมชชีน (ไทยแลนด์) จํากัด",
    taxId: "0145563001431",
    isBranch: false,
    branchCode: "00000",
    address: "30 หมู่ ที่ 9 สวนอุตสาหกรรมโรจนะ ตำบลธนู อำเภออุทัย จังหวัดพระนครศรีอยุธยา 13210",
    phone: "083-813-0833",
    email: "",
    type: "CUSTOMER",
    creditDays: 30,
    totalTransactions: 1,
    balanceDue: 1074658.78
  },
  {
    id: "cont-tsf-1",
    name: "nongnuch wongwai (135) / K.Alongkorn",
    companyName: "บริษัท ไทย เซกิซุย โฟม จำกัด",
    taxId: "0105539045865",
    isBranch: false,
    branchCode: "00000",
    address: "700/379 หมู่ 6 ตำบลดอนหัวฬ่อ อำเภอเมืองชลบุรี จังหวัดชลบุรี 20000",
    phone: "038-213-219-26",
    email: "nongnuch@sekisuifoam.co.th",
    type: "CUSTOMER",
    creditDays: 30,
    totalTransactions: 4,
    balanceDue: 3793792
  }
];

export const DEFAULT_ACCOUNTING_SUPPLIERS: AccountingContact[] = [
  {
    id: "cont-4",
    name: "คุณอารียา สุขสันต์",
    companyName: "บริษัท ออมรอน อีเลคทรอนิกส์ (ประเทศไทย) จำกัด",
    taxId: "0105533088991",
    isBranch: false,
    branchCode: "00000",
    address: "55 อาคารอาคเนย์ประกันภัย ชั้น 10 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500",
    phone: "02-637-5100",
    email: "omron_thailand@omron.com",
    type: "SUPPLIER",
    creditDays: 30,
    totalTransactions: 19,
    balanceDue: 94000
  },
  {
    id: "cont-ptech-1",
    name: "ฝ่ายขาย / ประสานงานขาย",
    companyName: "บริษัท พี-เทค แอนด์ คอนซัลติ้ง จำกัด",
    taxId: "0105568020018",
    isBranch: false,
    branchCode: "00000",
    address: "234/107 ถนน01 กาญจนาภิเษก แขวงสามวาตะวันตก เขตคลองสามวา กรุงเทพมหานคร 10510",
    phone: "+(66) 81 184 6590",
    email: "saintentex@gmail.com",
    type: "SUPPLIER",
    creditDays: 30,
    totalTransactions: 1,
    balanceDue: 0
  }
];
