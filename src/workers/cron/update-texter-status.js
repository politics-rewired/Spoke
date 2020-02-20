import knex from "knex";
import logger from "../../logger";
import { config } from "../../config";
import knexConfig from "../../server/knex";

const spokeDb = knex(knexConfig);
const assignmentManagerDb = knex({
  client: "mysql",
  connection: config.ASSIGNMENT_MANAGER_DATABASE_URL
});

const TEXTER_STATUS_MAP = {
  "do-not-assign": "do_not_approve",
  "full-member": "auto_approve",
  "in-training": "auto_approve"
};

const texterRankUpdates = [
  {
    rank: "full-member",
    email: "keith.crawford@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "david.ba.cohen@gmail.com"
  },
  {
    rank: "in-training",
    email: "benjamin.p.briles@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "ben.pike456@icloud.com"
  },
  {
    rank: "needs-watching",
    email: "reidatkantor@gmail.com"
  },
  {
    rank: "full-member",
    email: "amcsnacks@gmail.com"
  },
  {
    rank: "in-training",
    email: "dmoran@gbwl.org"
  },
  {
    rank: "in-training",
    email: "alibinzahid@hotmail.com"
  },
  {
    rank: "do-not-assign",
    email: "hollyahughes1210@gmail.com"
  },
  {
    rank: "full-member",
    email: "rachelgollay@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "dorothycrowley@yahoo.com"
  },
  {
    rank: "full-member",
    email: "jdgarcia.ad7@gmail.com"
  },
  {
    rank: "in-training",
    email: "heyblastbrandon@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "cameron.holland.0012@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "hgalioto@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "carrielarson9070@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "kaitlynswtam@gmail.com"
  },
  {
    rank: "full-member",
    email: "belajvenditti@yahoo.com"
  },
  {
    rank: "do-not-assign",
    email: "rmirk22@gmail.com"
  },
  {
    rank: "full-member",
    email: "danadubose@me.com"
  },
  {
    rank: "in-training",
    email: "charlesnicho2014@fau.edu"
  },
  {
    rank: "full-member",
    email: "megan.nijor@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "gfgoffman@gmail.com"
  },
  {
    rank: "in-training",
    email: "kblackman2@gmail.com"
  },
  {
    rank: "full-member",
    email: "klee19331@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "chaitanyacps@gmail.com"
  },
  {
    rank: "full-member",
    email: "alixdkane@gmail.com"
  },
  {
    rank: "full-member",
    email: "lauralcsw81@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "bncboston@gmail.com"
  },
  {
    rank: "full-member",
    email: "marceartmex@hotmail.com"
  },
  {
    rank: "full-member",
    email: "evanmetz15@gmail.com"
  },
  {
    rank: "in-training",
    email: "theomeros02@gmail.com"
  },
  {
    rank: "in-training",
    email: "timothyrenglish@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "ehalperin@gmail.com"
  },
  {
    rank: "in-training",
    email: "bootka@protonmail.ch"
  },
  {
    rank: "needs-watching",
    email: "bryan7@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "tammymoppin@yahoo.com"
  },
  {
    rank: "needs-watching",
    email: "clairer99@gmail.com"
  },
  {
    rank: "full-member",
    email: "listentothehorse@yahoo.com"
  },
  {
    rank: "do-not-assign",
    email: "auhsojhaynes@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "asa.af.mayall@gmail.com"
  },
  {
    rank: "full-member",
    email: "kyletyers@hotmail.com"
  },
  {
    rank: "full-member",
    email: "tehpoint@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "rosenberger.ad@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "idiot4wind@yahoo.com"
  },
  {
    rank: "needs-watching",
    email: "vacaesrey@gmail.com"
  },
  {
    rank: "in-training",
    email: "jlnash77@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "bill.schwimmer@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "tedwardsbhssc@gmail.com"
  },
  {
    rank: "full-member",
    email: "sebastian1golden2@gmail.com"
  },
  {
    rank: "full-member",
    email: "cristina_r11@hotmail.com"
  },
  {
    rank: "in-training",
    email: "greystaph@outlook.com"
  },
  {
    rank: "in-training",
    email: "mark.w.dickerson@gmail.com"
  },
  {
    rank: "in-training",
    email: "mchewning93@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "jzenouzi@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "gehlkx@gmail.com"
  },
  {
    rank: "full-member",
    email: "andrewatdcs@yahoo.com"
  },
  {
    rank: "needs-watching",
    email: "mallorcalisa@gmail.com"
  },
  {
    rank: "in-training",
    email: "dpoveromo16@gmail.com"
  },
  {
    rank: "in-training",
    email: "kreniche@comcast.net"
  },
  {
    rank: "needs-watching",
    email: "luucmeldgaard@outlook.com"
  },
  {
    rank: "needs-watching",
    email: "paulsandy24@gmail.com"
  },
  {
    rank: "full-member",
    email: "marisabudlong@gmail.com"
  },
  {
    rank: "in-training",
    email: "msemaan5@gmail.com"
  },
  {
    rank: "in-training",
    email: "cymcorrales@gmail.com"
  },
  {
    rank: "full-member",
    email: "tenrobots@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "dgrevstad@gmail.com"
  },
  {
    rank: "full-member",
    email: "michael.billeaux@gmail.com"
  },
  {
    rank: "full-member",
    email: "reibee@hotmail.com"
  },
  {
    rank: "full-member",
    email: "seattledj2002@yahoo.com"
  },
  {
    rank: "needs-watching",
    email: "joethayer1211@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "raad96@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "justin.deichman@gmail.com"
  },
  {
    rank: "in-training",
    email: "dswiderski9@gmail.com"
  },
  {
    rank: "full-member",
    email: "parmelee.tyler@gmail.com"
  },
  {
    rank: "full-member",
    email: "dshuster87@gmail.com"
  },
  {
    rank: "full-member",
    email: "rohdekaitlin@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "yoseph.m@hotmail.com"
  },
  {
    rank: "full-member",
    email: "mdcoraccio@gmail.com"
  },
  {
    rank: "in-training",
    email: "rghodnett82@gmail.com"
  },
  {
    rank: "in-training",
    email: "marenbelljones@gmail.com"
  },
  {
    rank: "full-member",
    email: "bennyroover@gmail.com"
  },
  {
    rank: "full-member",
    email: "edwardsrm@live.com"
  },
  {
    rank: "in-training",
    email: "tifisbane@gmail.com"
  },
  {
    rank: "in-training",
    email: "steviehschmidt@gmail.com"
  },
  {
    rank: "full-member",
    email: "lauren.ochoa@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "davidek737@gmail.com"
  },
  {
    rank: "full-member",
    email: "kebarnes3@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "lauren.mallet@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "jscop@telus.net"
  },
  {
    rank: "needs-watching",
    email: "griffinjhnsn13@gmail.com"
  },
  {
    rank: "full-member",
    email: "abbypopple@yahoo.com"
  },
  {
    rank: "in-training",
    email: "robertscottbetz@gmail.com"
  },
  {
    rank: "in-training",
    email: "brading.md@gmail.com"
  },
  {
    rank: "full-member",
    email: "duncan.m.gallagher@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "jordan.rhone@aol.com"
  },
  {
    rank: "full-member",
    email: "vamptvo@gmail.com"
  },
  {
    rank: "full-member",
    email: "jacquelineazis@gmail.com"
  },
  {
    rank: "full-member",
    email: "slindenman@gmail.com"
  },
  {
    rank: "in-training",
    email: "evemary056@gmail.com"
  },
  {
    rank: "in-training",
    email: "connorf@bell.net"
  },
  {
    rank: "in-training",
    email: "dallindarger@gmail.com"
  },
  {
    rank: "in-training",
    email: "patrickburgess8@gmail.com"
  },
  {
    rank: "in-training",
    email: "angus.mcfarland@gmail.com"
  },
  {
    rank: "in-training",
    email: "dakuna@outlook.com"
  },
  {
    rank: "full-member",
    email: "mikeeflores8@gmail.com"
  },
  {
    rank: "full-member",
    email: "melcro@gmail.com"
  },
  {
    rank: "in-training",
    email: "phillipwall378@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "jackjenk@iu.edu"
  },
  {
    rank: "in-training",
    email: "cesarg907@gmail.com"
  },
  {
    rank: "in-training",
    email: "info@freeingourselves.com"
  },
  {
    rank: "full-member",
    email: "hellomonkey42@gmail.com"
  },
  {
    rank: "full-member",
    email: "willkurach@gmail.com"
  },
  {
    rank: "full-member",
    email: "eparisher@hotmail.com"
  },
  {
    rank: "needs-watching",
    email: "bigandyk4@gmail.com"
  },
  {
    rank: "in-training",
    email: "contact.josephmkennedy@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "danielhberger@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "ethan.hallerman@gmail.com"
  },
  {
    rank: "in-training",
    email: "garrettjemail@gmail.com"
  },
  {
    rank: "in-training",
    email: "ashleyalinda@protonmail.com"
  },
  {
    rank: "in-training",
    email: "santyias87@gmail.com"
  },
  {
    rank: "in-training",
    email: "matthijshenkhorst@gmail.com"
  },
  {
    rank: "in-training",
    email: "philip.oosterholt@student.uva.nl"
  },
  {
    rank: "full-member",
    email: "paige.haring2014@gmail.com"
  },
  {
    rank: "full-member",
    email: "ztingley@umich.edu"
  },
  {
    rank: "full-member",
    email: "anniekgoodenough@gmail.com"
  },
  {
    rank: "in-training",
    email: "glen.tennyson@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "darlingtrey@ymail.com"
  },
  {
    rank: "full-member",
    email: "john@olmsted.io"
  },
  {
    rank: "in-training",
    email: "janmacgregor29@gmail.com"
  },
  {
    rank: "in-training",
    email: "carter.sigl0@gmail.com"
  },
  {
    rank: "full-member",
    email: "nataliehannah@live.com"
  },
  {
    rank: "full-member",
    email: "janekcurrens@gmail.com"
  },
  {
    rank: "full-member",
    email: "richrmurphy@gmail.com"
  },
  {
    rank: "full-member",
    email: "jnzabinski@gmail.com"
  },
  {
    rank: "full-member",
    email: "peppermintpocky@yahoo.com"
  },
  {
    rank: "full-member",
    email: "caseyellis@utexas.edu"
  },
  {
    rank: "do-not-assign",
    email: "mahavakya@hotmail.com"
  },
  {
    rank: "full-member",
    email: "qmzabuzasan@hotmail.com"
  },
  {
    rank: "full-member",
    email: "sangeetagoel2@gmail.com"
  },
  {
    rank: "full-member",
    email: "lgriffin@putneyschool.org"
  },
  {
    rank: "full-member",
    email: "danmcninch@gmail.com"
  },
  {
    rank: "in-training",
    email: "alana.jc.lynch@gmail.com"
  },
  {
    rank: "full-member",
    email: "gcavazos110@gmail.com"
  },
  {
    rank: "full-member",
    email: "evanelijahyoung@gmail.com"
  },
  {
    rank: "full-member",
    email: "karthik.lxmit@gmail.com"
  },
  {
    rank: "full-member",
    email: "katemills1985@gmail.com"
  },
  {
    rank: "in-training",
    email: "nicole.esque@gmail.com"
  },
  {
    rank: "full-member",
    email: "laurachow11@gmail.com"
  },
  {
    rank: "full-member",
    email: "brendenboyatt@gmail.com"
  },
  {
    rank: "full-member",
    email: "lauraleeharkins@gmail.com"
  },
  {
    rank: "in-training",
    email: "seeldaniel@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "seanaasen@yahoo.com"
  },
  {
    rank: "in-training",
    email: "barefootragamuffin@gmail.com"
  },
  {
    rank: "full-member",
    email: "garrett.bodley@gmail.com"
  },
  {
    rank: "in-training",
    email: "hsaufferer@yahoo.com"
  },
  {
    rank: "in-training",
    email: "mbevi90@gmail.com"
  },
  {
    rank: "in-training",
    email: "20chenka@abschools.org"
  },
  {
    rank: "full-member",
    email: "romygarrido@gmail.com"
  },
  {
    rank: "in-training",
    email: "jasmeenkanwal@gmail.com"
  },
  {
    rank: "full-member",
    email: "20hernandezs@smhall.org"
  },
  {
    rank: "full-member",
    email: "hudsonnkh@gmail.com"
  },
  {
    rank: "full-member",
    email: "henryevogt@yahoo.com"
  },
  {
    rank: "in-training",
    email: "hailey.karcher@gmail.com"
  },
  {
    rank: "full-member",
    email: "biggshc@gmail.com"
  },
  {
    rank: "full-member",
    email: "zacharysmith2012@gmail.com"
  },
  {
    rank: "full-member",
    email: "tifftruj@indiana.edu"
  },
  {
    rank: "needs-watching",
    email: "fullofteeth@gmail.com"
  },
  {
    rank: "full-member",
    email: "chris.nesrallah@gmail.com"
  },
  {
    rank: "in-training",
    email: "andrewqkoller@gmail.com"
  },
  {
    rank: "full-member",
    email: "emilyorlich@gmail.com"
  },
  {
    rank: "full-member",
    email: "dspencerharris@gmail.com"
  },
  {
    rank: "full-member",
    email: "lencannon@gmail.com"
  },
  {
    rank: "full-member",
    email: "christina.m.oneil@gmail.com"
  },
  {
    rank: "in-training",
    email: "cczora180@gmail.com"
  },
  {
    rank: "in-training",
    email: "maxmuji@gmail.com"
  },
  {
    rank: "in-training",
    email: "dr.kellyraylinsky.nd@gmail.com"
  },
  {
    rank: "in-training",
    email: "laceylantz@gmail.com"
  },
  {
    rank: "in-training",
    email: "ben.d.cox@gmail.com"
  },
  {
    rank: "full-member",
    email: "b263e4458526a@c59b82b94e3d.net"
  },
  {
    rank: "needs-watching",
    email: "christina.nerini@am.jll.com"
  },
  {
    rank: "full-member",
    email: "katie.mccarthy@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "bmh421@gmail.com"
  },
  {
    rank: "full-member",
    email: "jaotter123@gmail.com"
  },
  {
    rank: "in-training",
    email: "leann.schuering@gmail.com"
  },
  {
    rank: "full-member",
    email: "emily@emilyglinick.com"
  },
  {
    rank: "full-member",
    email: "elizabeth.m.trussell@gmail.com"
  },
  {
    rank: "in-training",
    email: "erikaseibs@gmail.com"
  },
  {
    rank: "in-training",
    email: "garcia.family94@gmail.com"
  },
  {
    rank: "in-training",
    email: "brian.lutenegger@gmail.com"
  },
  {
    rank: "full-member",
    email: "colleenbrola@gmail.com"
  },
  {
    rank: "full-member",
    email: "clintjohnso@gmail.com"
  },
  {
    rank: "in-training",
    email: "b.brezic@gmail.com"
  },
  {
    rank: "full-member",
    email: "vectorjohn@gmail.com"
  },
  {
    rank: "full-member",
    email: "natashayelliott@gmail.com"
  },
  {
    rank: "in-training",
    email: "dfillion@gmail.com"
  },
  {
    rank: "full-member",
    email: "cody.berdinis@gmail.com"
  },
  {
    rank: "full-member",
    email: "rmjk56@gmail.com"
  },
  {
    rank: "in-training",
    email: "jonbwalsh@gmail.com"
  },
  {
    rank: "full-member",
    email: "lamiaa.kabary@gmail.com"
  },
  {
    rank: "full-member",
    email: "radiance.bean@outlook.com"
  },
  {
    rank: "in-training",
    email: "jefdwilson@gmail.com"
  },
  {
    rank: "full-member",
    email: "hayleyelp@gmail.com"
  },
  {
    rank: "in-training",
    email: "jbaritot@gmail.com"
  },
  {
    rank: "in-training",
    email: "jnelson6003@gmail.com"
  },
  {
    rank: "full-member",
    email: "llearst@gmail.com"
  },
  {
    rank: "full-member",
    email: "nckdandrea@yahoo.com"
  },
  {
    rank: "do-not-assign",
    email: "shaikrafi7@gmail.com"
  },
  {
    rank: "in-training",
    email: "clykrayz@aol.com"
  },
  {
    rank: "full-member",
    email: "riaofthecoos@gmail.com"
  },
  {
    rank: "in-training",
    email: "vic.cap@gmail.com"
  },
  {
    rank: "full-member",
    email: "ajjordan27@gmail.com"
  },
  {
    rank: "full-member",
    email: "grace.fan@portageps.org"
  },
  {
    rank: "in-training",
    email: "kennethobstarczyk@gmail.com"
  },
  {
    rank: "full-member",
    email: "emilymae221@gmail.com"
  },
  {
    rank: "in-training",
    email: "rob.hausler@posteo.net"
  },
  {
    rank: "full-member",
    email: "darkperl@gmail.com"
  },
  {
    rank: "in-training",
    email: "mmarkpett@gmail.com"
  },
  {
    rank: "full-member",
    email: "ruthwilmore@hotmail.com"
  },
  {
    rank: "full-member",
    email: "madoreelizabeth@gmail.com"
  },
  {
    rank: "full-member",
    email: "clairegrooby1@gmail.com"
  },
  {
    rank: "in-training",
    email: "jacob.c.bourne@gmail.com"
  },
  {
    rank: "in-training",
    email: "morganvessel@gmail.com"
  },
  {
    rank: "full-member",
    email: "jesoh69029@nwesmail.com"
  },
  {
    rank: "in-training",
    email: "mattaz1594@yahoo.com"
  },
  {
    rank: "in-training",
    email: "dreatherobot@gmail.com"
  },
  {
    rank: "full-member",
    email: "reredots98@gmail.com"
  },
  {
    rank: "in-training",
    email: "erinjwilson94@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "paulinabrassington@gmail.com"
  },
  {
    rank: "do-not-assign",
    email: "tarkellyt@gmail.com"
  },
  {
    rank: "in-training",
    email: "breadcrumtrail@gmail.com"
  },
  {
    rank: "full-member",
    email: "sercan09@gmail.com"
  },
  {
    rank: "full-member",
    email: "neilcalloway@gmail.com"
  },
  {
    rank: "full-member",
    email: "nataliejnimmo@gmail.com"
  },
  {
    rank: "in-training",
    email: "heavencouncilor.hc@gmail.com"
  },
  {
    rank: "full-member",
    email: "tilting10bi@gmail.com"
  },
  {
    rank: "full-member",
    email: "michele.vera@gmail.com"
  },
  {
    rank: "in-training",
    email: "kate.nadel@gmail.com"
  },
  {
    rank: "in-training",
    email: "lydia.golden@slu.edu"
  },
  {
    rank: "in-training",
    email: "trlodge@sbcglobal.net"
  },
  {
    rank: "in-training",
    email: "amb7cn@virginia.edu"
  },
  {
    rank: "in-training",
    email: "claricescop@yahoo.com"
  },
  {
    rank: "in-training",
    email: "fun2nurse@gmail.com"
  },
  {
    rank: "in-training",
    email: "ericchristiansen@cmail.carleton.ca"
  },
  {
    rank: "full-member",
    email: "tomas.petkov92@gmail.com"
  },
  {
    rank: "full-member",
    email: "rachaelwarren000@gmail.com"
  },
  {
    rank: "in-training",
    email: "dakotamaclennan@gmail.com"
  },
  {
    rank: "full-member",
    email: "jack11goodman@gmail.com"
  },
  {
    rank: "full-member",
    email: "stevenmichaelwarner@gmail.com"
  },
  {
    rank: "in-training",
    email: "helena.kaplun@gmail.com"
  },
  {
    rank: "in-training",
    email: "frangipane.bret@berkeley.edu"
  },
  {
    rank: "in-training",
    email: "jabram@hotmail.com"
  },
  {
    rank: "in-training",
    email: "p.j.harland@hotmail.de"
  },
  {
    rank: "in-training",
    email: "alexsathern@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "rebekah.horowitz@gmail.com"
  },
  {
    rank: "full-member",
    email: "celeste.jackson83@gmail.com"
  },
  {
    rank: "in-training",
    email: "caelinjfoley@gmail.com"
  },
  {
    rank: "in-training",
    email: "elizabethhood837@gmail.com"
  },
  {
    rank: "full-member",
    email: "emilyyoung2012@u.northwestern.edu"
  },
  {
    rank: "in-training",
    email: "aimeedmyers@gmail.com"
  },
  {
    rank: "full-member",
    email: "tbluestine@gmail.com"
  },
  {
    rank: "in-training",
    email: "amacdonald@wesleyan.edu"
  },
  {
    rank: "in-training",
    email: "dramamime@gmail.com"
  },
  {
    rank: "in-training",
    email: "jelkayjoaco@yahoo.com"
  },
  {
    rank: "in-training",
    email: "lily.oberman1@gmail.com"
  },
  {
    rank: "in-training",
    email: "sarahbarbosky@gmail.com"
  },
  {
    rank: "in-training",
    email: "bmschulz94@gmail.com"
  },
  {
    rank: "in-training",
    email: "eric.javier.irizarry@gmail.com"
  },
  {
    rank: "in-training",
    email: "moore.1672@osu.edu"
  },
  {
    rank: "in-training",
    email: "jalex813@gmail.com"
  },
  {
    rank: "in-training",
    email: "kaseye1997@gmail.com"
  },
  {
    rank: "in-training",
    email: "emilianovee@gmail.com"
  },
  {
    rank: "in-training",
    email: "frutkinalexander@gmail.com"
  },
  {
    rank: "in-training",
    email: "1997lieke@gmail.com"
  },
  {
    rank: "in-training",
    email: "grace.dustin@gmail.com"
  },
  {
    rank: "in-training",
    email: "newkeyrachel@gmail.com"
  },
  {
    rank: "in-training",
    email: "twwyckoff@hotmail.com"
  },
  {
    rank: "in-training",
    email: "larriane22ak@gmail.com"
  },
  {
    rank: "in-training",
    email: "lexeladd@gmail.com"
  },
  {
    rank: "in-training",
    email: "alex.erlenbach@gmail.com"
  },
  {
    rank: "in-training",
    email: "amyc.catherine@gmail.com"
  },
  {
    rank: "in-training",
    email: "beccataplin@gmail.com"
  },
  {
    rank: "in-training",
    email: "troysswain@gmail.com"
  },
  {
    rank: "in-training",
    email: "jonas.frich@gmail.com"
  },
  {
    rank: "in-training",
    email: "john.bhadelia@gmail.com"
  },
  {
    rank: "in-training",
    email: "sevkempf@gmail.com"
  },
  {
    rank: "in-training",
    email: "wogelife@mac.com"
  },
  {
    rank: "in-training",
    email: "jonathanpottle@gmail.com"
  },
  {
    rank: "in-training",
    email: "cemurphy0217@gmail.com"
  },
  {
    rank: "in-training",
    email: "thelordofcorners@gmail.com"
  },
  {
    rank: "full-member",
    email: "princesszerosuit@gmail.com"
  },
  {
    rank: "in-training",
    email: "ddanielvalenza@gmail.com"
  },
  {
    rank: "in-training",
    email: "joshuaadams2@csus.edu"
  },
  {
    rank: "in-training",
    email: "hooverdaniellehd@gmail.com"
  },
  {
    rank: "in-training",
    email: "lncarter@gmail.com"
  },
  {
    rank: "needs-watching",
    email: "cnitroy@me.com"
  },
  {
    rank: "in-training",
    email: "laurenrebeccaweinstein@gmail.com"
  },
  {
    rank: "in-training",
    email: "tim@timsoter.com"
  },
  {
    rank: "in-training",
    email: "ellieingramm@gmail.com"
  },
  {
    rank: "in-training",
    email: "connor1621@gmail.com"
  },
  {
    rank: "in-training",
    email: "trobertson1210@gmail.com"
  },
  {
    rank: "in-training",
    email: "rarbelo1@gmail.com"
  },
  {
    rank: "in-training",
    email: "knkenne12@gmail.com"
  },
  {
    rank: "in-training",
    email: "kambri6@gmail.com"
  },
  {
    rank: "in-training",
    email: "sam.dicecco@gmail.com"
  },
  {
    rank: "in-training",
    email: "michael.v.jones843@gmail.com"
  },
  {
    rank: "in-training",
    email: "abcary93@gmail.com"
  },
  {
    rank: "in-training",
    email: "jphat26@gmail.com"
  },
  {
    rank: "in-training",
    email: "josh.nichols.lives@gmail.com"
  },
  {
    rank: "in-training",
    email: "chase.paulina.gregory@gmail.com"
  },
  {
    rank: "in-training",
    email: "jamesjdavis2@gmail.com"
  },
  {
    rank: "in-training",
    email: "patricia.johnsoncastle@gmail.com"
  },
  {
    rank: "in-training",
    email: "marcusjmerritt@gmail.com"
  },
  {
    rank: "in-training",
    email: "jessica.laderman@gmail.com"
  },
  {
    rank: "in-training",
    email: "rpgilmore3@gmail.com"
  },
  {
    rank: "in-training",
    email: "elizabethrosebryson@gmail.com"
  },
  {
    rank: "in-training",
    email: "eth.krajewski@gmail.com"
  },
  {
    rank: "in-training",
    email: "parham.patrick@gmail.com"
  },
  {
    rank: "in-training",
    email: "aaron.bornstein@gmail.com"
  },
  {
    rank: "in-training",
    email: "megan.k.kakimoto@gmail.com"
  },
  {
    rank: "in-training",
    email: "ks.sweta@gmail.com"
  },
  {
    rank: "in-training",
    email: "ealpina@gmail.com"
  },
  {
    rank: "in-training",
    email: "maxkramer@email.arizona.edu"
  },
  {
    rank: "in-training",
    email: "dylansures@gmail.com"
  },
  {
    rank: "full-member",
    email: "comellen91@gmail.com"
  },
  {
    rank: "full-member",
    email: "juliactil@gmail.com"
  },
  {
    rank: "in-training",
    email: "msmajda@gmail.com"
  },
  {
    rank: "in-training",
    email: "joshuacrheinheimer@gmail.com"
  },
  {
    rank: "in-training",
    email: "hollyalakey@gmail.com"
  },
  {
    rank: "in-training",
    email: "jrainwater264@gmail.com"
  },
  {
    rank: "in-training",
    email: "ssanchezkrystal@gmail.com"
  },
  {
    rank: "in-training",
    email: "jessica.kankovsky@gmail.com"
  },
  {
    rank: "in-training",
    email: "joeabourdage@gmail.com"
  },
  {
    rank: "in-training",
    email: "pkersh2001@gmail.com"
  },
  {
    rank: "in-training",
    email: "sixty40@gmail.com"
  },
  {
    rank: "in-training",
    email: "castewart24@gmail.com"
  },
  {
    rank: "in-training",
    email: "jennychwu@gmail.com"
  },
  {
    rank: "in-training",
    email: "jwnyland@gmail.com"
  },
  {
    rank: "in-training",
    email: "jwrothchild@gmail.com"
  },
  {
    rank: "in-training",
    email: "jones.caitlin.s@gmail.com"
  },
  {
    rank: "in-training",
    email: "spangloamerican@gmail.com"
  },
  {
    rank: "in-training",
    email: "schaeferdrew97@gmail.com"
  },
  {
    rank: "in-training",
    email: "jeremyfleck01@gmail.com"
  },
  {
    rank: "in-training",
    email: "andypelerine@gmail.com"
  },
  {
    rank: "in-training",
    email: "stephaniedshaw@gmail.com"
  },
  {
    rank: "in-training",
    email: "aashpis@gmail.com"
  },
  {
    rank: "in-training",
    email: "megmac1988@gmail.com"
  },
  {
    rank: "in-training",
    email: "linnea.laestadius@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryan42coolman@gmail.com"
  },
  {
    rank: "in-training",
    email: "warnerdominic1@gmail.com"
  },
  {
    rank: "in-training",
    email: "andrew.e.fj@gmail.com"
  },
  {
    rank: "in-training",
    email: "athela.frandsen@gmail.com"
  },
  {
    rank: "in-training",
    email: "mkt135@gmail.com"
  },
  {
    rank: "in-training",
    email: "wahaj19988@gmail.com"
  },
  {
    rank: "in-training",
    email: "chusseini1116@gmail.com"
  },
  {
    rank: "in-training",
    email: "piplakey@gmail.com"
  },
  {
    rank: "in-training",
    email: "accountsnstuff@sonic.net"
  },
  {
    rank: "in-training",
    email: "ruffmansean@gmail.com"
  },
  {
    rank: "in-training",
    email: "aseyfarth@aseyfarth.name"
  },
  {
    rank: "in-training",
    email: "zebratangerine22@gmail.com"
  },
  {
    rank: "in-training",
    email: "shortnessinc@icloud.com"
  },
  {
    rank: "in-training",
    email: "neuraljojo@gmail.com"
  },
  {
    rank: "in-training",
    email: "jillsmo@gmail.com"
  },
  {
    rank: "in-training",
    email: "jtb1210@gmail.com"
  },
  {
    rank: "in-training",
    email: "zoe.keve@gmail.com"
  },
  {
    rank: "in-training",
    email: "jameshrobinson15@gmail.com"
  },
  {
    rank: "in-training",
    email: "vicketysplit@gmail.com"
  },
  {
    rank: "in-training",
    email: "tylerthayer94@gmail.com"
  },
  {
    rank: "in-training",
    email: "meagan.seyfarth@gmail.com"
  },
  {
    rank: "in-training",
    email: "outpostproject@gmail.com"
  },
  {
    rank: "in-training",
    email: "brianmccann12@gmail.com"
  },
  {
    rank: "in-training",
    email: "clara.lengacher@yahoo.com"
  },
  {
    rank: "in-training",
    email: "taylorfessenden@gmail.com"
  },
  {
    rank: "in-training",
    email: "tjc2198@gmail.com"
  },
  {
    rank: "in-training",
    email: "nmorley17@gmail.com"
  },
  {
    rank: "in-training",
    email: "19nmanna94@gmail.com"
  },
  {
    rank: "in-training",
    email: "fa.dvorkin@gmail.com"
  },
  {
    rank: "in-training",
    email: "jasonstaicer@gmail.com"
  },
  {
    rank: "in-training",
    email: "bruno.giovannoni@gmail.com"
  },
  {
    rank: "in-training",
    email: "timleyba@gmail.com"
  },
  {
    rank: "in-training",
    email: "scaranograce@gmail.com"
  },
  {
    rank: "in-training",
    email: "rebeccakoonz@yahoo.com"
  },
  {
    rank: "in-training",
    email: "jeffmcmillan@gmail.com"
  },
  {
    rank: "in-training",
    email: "maxwellrlogan@gmail.com"
  },
  {
    rank: "in-training",
    email: "maria.s.costantini@gmail.com"
  },
  {
    rank: "in-training",
    email: "oequis@aol.com"
  },
  {
    rank: "in-training",
    email: "jonasdvs12@gmail.com"
  },
  {
    rank: "in-training",
    email: "luckyjimmy10@comcast.net"
  },
  {
    rank: "in-training",
    email: "ljreynol@gmail.com"
  },
  {
    rank: "in-training",
    email: "alex.iainttellinyou@gmail.com"
  },
  {
    rank: "in-training",
    email: "basmithncs@gmail.com"
  },
  {
    rank: "in-training",
    email: "rachelhalllipscomb@gmail.com"
  },
  {
    rank: "in-training",
    email: "brent@abs-tract.org"
  },
  {
    rank: "in-training",
    email: "jhansen2235@gmail.com"
  },
  {
    rank: "in-training",
    email: "endlesscircle@protonmail.com"
  },
  {
    rank: "in-training",
    email: "noided@gmail.com"
  },
  {
    rank: "full-member",
    email: "lukethunberg@gmail.com"
  },
  {
    rank: "in-training",
    email: "jonkeimshenk@gmail.com"
  },
  {
    rank: "in-training",
    email: "davidwilliamwhite99@gmail.com"
  },
  {
    rank: "in-training",
    email: "yunyi.ok@gmail.com"
  },
  {
    rank: "in-training",
    email: "graysonearle@gmail.com"
  },
  {
    rank: "in-training",
    email: "jackandes@gmail.com"
  },
  {
    rank: "in-training",
    email: "danielhluehrs@gmail.com"
  },
  {
    rank: "in-training",
    email: "ggmoya@me.com"
  },
  {
    rank: "in-training",
    email: "jennagrc@aol.com"
  },
  {
    rank: "in-training",
    email: "wierschkejordan@gmail.com"
  },
  {
    rank: "in-training",
    email: "benjymalings@berkeley.edu"
  },
  {
    rank: "in-training",
    email: "atharv2046@gmail.com"
  },
  {
    rank: "in-training",
    email: "turbler@yahoo.ca"
  },
  {
    rank: "in-training",
    email: "vincent92smith@gmail.com"
  },
  {
    rank: "in-training",
    email: "m.c.mail@att.net"
  },
  {
    rank: "in-training",
    email: "jd.warfield@gmail.com"
  },
  {
    rank: "in-training",
    email: "kdepew85@gmail.com"
  },
  {
    rank: "in-training",
    email: "nugget10@gmail.com"
  },
  {
    rank: "in-training",
    email: "chris.bigger@gmail.com"
  },
  {
    rank: "in-training",
    email: "nathaniel.jurcago@gmail.com"
  },
  {
    rank: "in-training",
    email: "phil.bernstein115@gmail.com"
  },
  {
    rank: "in-training",
    email: "zawehzaweh@gmail.com"
  },
  {
    rank: "in-training",
    email: "brankica@gmail.com"
  },
  {
    rank: "in-training",
    email: "wgward@gmail.com"
  },
  {
    rank: "in-training",
    email: "braden@bgammon.me"
  },
  {
    rank: "in-training",
    email: "jlarson448@gmail.com"
  },
  {
    rank: "in-training",
    email: "estela.eal@gmail.com"
  },
  {
    rank: "in-training",
    email: "earguello1010@gmail.com"
  },
  {
    rank: "in-training",
    email: "keithjpowell@gmail.com"
  },
  {
    rank: "full-member",
    email: "gonzaloerodriguez@outlook.com"
  },
  {
    rank: "in-training",
    email: "seguardado88@gmail.com"
  },
  {
    rank: "in-training",
    email: "emmabrowning2000@yahoo.com"
  },
  {
    rank: "in-training",
    email: "xanderbier@gmail.com"
  },
  {
    rank: "in-training",
    email: "beandeclan@gmail.com"
  },
  {
    rank: "in-training",
    email: "jeffereymbruce@gmail.com"
  },
  {
    rank: "in-training",
    email: "jackgschuler@gmail.com"
  },
  {
    rank: "in-training",
    email: "sonnyg789@gmail.com"
  },
  {
    rank: "in-training",
    email: "winslowsonlyhope@gmail.com"
  },
  {
    rank: "in-training",
    email: "romeroam@musc.edu"
  },
  {
    rank: "in-training",
    email: "kassandramknudson@gmail.com"
  },
  {
    rank: "in-training",
    email: "joe.rybarczyk@me.com"
  },
  {
    rank: "in-training",
    email: "matt.ebert@gmail.com"
  },
  {
    rank: "in-training",
    email: "davidpineiro92@gmail.com"
  },
  {
    rank: "in-training",
    email: "2rosasm@gmail.com"
  },
  {
    rank: "in-training",
    email: "kyhc0425@gmail.com"
  },
  {
    rank: "in-training",
    email: "juliancmoore87@gmail.com"
  },
  {
    rank: "in-training",
    email: "zzhuynh@yahoo.com"
  },
  {
    rank: "in-training",
    email: "edp2bdunn@gmail.com"
  },
  {
    rank: "in-training",
    email: "karissa.lewis1612@gmail.com"
  },
  {
    rank: "in-training",
    email: "betweenreyandj@gmail.com"
  },
  {
    rank: "in-training",
    email: "katie.herman@gmail.com"
  },
  {
    rank: "in-training",
    email: "rogelio.becram@gmail.com"
  },
  {
    rank: "in-training",
    email: "jlok93@gmail.com"
  },
  {
    rank: "in-training",
    email: "giuliagirgenti@gmail.com"
  },
  {
    rank: "in-training",
    email: "robjeffreywriting@gmail.com"
  },
  {
    rank: "in-training",
    email: "jmichaeljennings@gmail.com"
  },
  {
    rank: "full-member",
    email: "meganschneider77@gmail.com"
  },
  {
    rank: "in-training",
    email: "estherabosch@gmail.com"
  },
  {
    rank: "in-training",
    email: "dean.jackson@myself.com"
  },
  {
    rank: "in-training",
    email: "rileywinch13@gmail.com"
  },
  {
    rank: "in-training",
    email: "t.pazin@gmail.com"
  },
  {
    rank: "in-training",
    email: "lachlan@doig.org"
  },
  {
    rank: "in-training",
    email: "swaddin@g.clemson.edu"
  },
  {
    rank: "in-training",
    email: "jlandes14@gmail.com"
  },
  {
    rank: "in-training",
    email: "vera.julie@gmail.com"
  },
  {
    rank: "in-training",
    email: "moss.tommy@aol.com"
  },
  {
    rank: "in-training",
    email: "vonstar33@gmail.com"
  },
  {
    rank: "in-training",
    email: "policolau@gmail.com"
  },
  {
    rank: "in-training",
    email: "halchriza@gmail.com"
  },
  {
    rank: "in-training",
    email: "bloodedbythought@gmail.com"
  },
  {
    rank: "in-training",
    email: "alysiachavez@icloud.com"
  },
  {
    rank: "in-training",
    email: "gavin.magdycz@gmail.com"
  },
  {
    rank: "in-training",
    email: "mkhamze@gmail.com"
  },
  {
    rank: "in-training",
    email: "bjm7b2@mail.missouri.edu"
  },
  {
    rank: "in-training",
    email: "crystalbender0@gmail.com"
  },
  {
    rank: "in-training",
    email: "txt4burn1e@gmail.com"
  },
  {
    rank: "in-training",
    email: "corey@imaginescholar.org"
  },
  {
    rank: "in-training",
    email: "jarrahbeattie@gmail.com"
  },
  {
    rank: "in-training",
    email: "evepinkpat9@gmail.com"
  },
  {
    rank: "in-training",
    email: "elisabeth.gerhalter@gmail.com"
  },
  {
    rank: "in-training",
    email: "martinjosip@hotmail.com"
  },
  {
    rank: "in-training",
    email: "rrrron@gmail.com"
  },
  {
    rank: "in-training",
    email: "jlefelixrafael@yahoo.com"
  },
  {
    rank: "in-training",
    email: "dallas.willms@gmail.com"
  },
  {
    rank: "in-training",
    email: "alboyan@yahoo.com"
  },
  {
    rank: "in-training",
    email: "jarrodlentz@gmail.com"
  },
  {
    rank: "in-training",
    email: "ranivand@gmail.com"
  },
  {
    rank: "in-training",
    email: "richardluismartin@gmail.com"
  },
  {
    rank: "in-training",
    email: "themegmeg@gmail.com"
  },
  {
    rank: "in-training",
    email: "camdrakehutcheson@gmail.com"
  },
  {
    rank: "in-training",
    email: "genevievemphillips@gmail.com"
  },
  {
    rank: "in-training",
    email: "dmalkemes@gmail.com"
  },
  {
    rank: "in-training",
    email: "yasminibarra23@gmail.com"
  },
  {
    rank: "in-training",
    email: "sstvns66@gmail.com"
  },
  {
    rank: "in-training",
    email: "oliverwill@mindspring.com"
  },
  {
    rank: "in-training",
    email: "sandlerdj@gmail.com"
  },
  {
    rank: "in-training",
    email: "rphealy1994@gmail.com"
  },
  {
    rank: "in-training",
    email: "oltmannsolivia@gmail.com"
  },
  {
    rank: "in-training",
    email: "cole.827@osu.edu"
  },
  {
    rank: "in-training",
    email: "meghan.vanleuwen@gmail.com"
  },
  {
    rank: "in-training",
    email: "macintosh.cox@gmail.com"
  },
  {
    rank: "in-training",
    email: "jeremgy@gmail.com"
  },
  {
    rank: "in-training",
    email: "larry.dang2018@gmail.com"
  },
  {
    rank: "in-training",
    email: "oltretorrente@gmail.com"
  },
  {
    rank: "in-training",
    email: "hey@tommymcdermott.com"
  },
  {
    rank: "in-training",
    email: "caroline.packers12@gmail.com"
  },
  {
    rank: "in-training",
    email: "dougmarkowitz42@gmail.com"
  },
  {
    rank: "in-training",
    email: "ashertlalka@gmail.com"
  },
  {
    rank: "in-training",
    email: "raphaeldreyfuss@gmail.com"
  },
  {
    rank: "in-training",
    email: "jack.lebowitz@me.com"
  },
  {
    rank: "in-training",
    email: "r.hyunjeong@gmail.com"
  },
  {
    rank: "in-training",
    email: "eva.hanscom@gmail.com"
  },
  {
    rank: "in-training",
    email: "alyshwedo@gmail.com"
  },
  {
    rank: "in-training",
    email: "dylanzavagno@gmail.com"
  },
  {
    rank: "in-training",
    email: "logandragone@gmail.com"
  },
  {
    rank: "in-training",
    email: "djparish87@gmail.com"
  },
  {
    rank: "in-training",
    email: "chrisbenson102@gmail.com"
  },
  {
    rank: "in-training",
    email: "camillelcanter@gmail.com"
  },
  {
    rank: "in-training",
    email: "johngroot94@gmail.com"
  },
  {
    rank: "in-training",
    email: "wahzrc@mst.edu"
  },
  {
    rank: "in-training",
    email: "joannawilsonphillips@gmail.com"
  },
  {
    rank: "in-training",
    email: "lembergerben@gmail.com"
  },
  {
    rank: "in-training",
    email: "carlosahrnandez@gmail.com"
  },
  {
    rank: "in-training",
    email: "spcarman@stanford.edu"
  },
  {
    rank: "in-training",
    email: "cgoldstein96@gmail.com"
  },
  {
    rank: "in-training",
    email: "phr3dtheripper@gmail.com"
  },
  {
    rank: "in-training",
    email: "ralphmcgeary@gmail.com"
  },
  {
    rank: "in-training",
    email: "corneliusk67@gmail.com"
  },
  {
    rank: "in-training",
    email: "josh.shaddick@gmail.com"
  },
  {
    rank: "in-training",
    email: "autumn.chmil@gmail.com"
  },
  {
    rank: "in-training",
    email: "nvwolf@gmail.com"
  },
  {
    rank: "in-training",
    email: "devon.scotttunkin@gmail.com"
  },
  {
    rank: "in-training",
    email: "cote289@gmail.com"
  },
  {
    rank: "in-training",
    email: "coopcooperberg@gmail.com"
  },
  {
    rank: "in-training",
    email: "stefanie816@gmail.com"
  },
  {
    rank: "in-training",
    email: "nwkahumoku@gmail.com"
  },
  {
    rank: "in-training",
    email: "mburoker2@gmail.com"
  },
  {
    rank: "in-training",
    email: "rupperthanna24@gmail.com"
  },
  {
    rank: "in-training",
    email: "yankeebabygirl@gmail.com"
  },
  {
    rank: "in-training",
    email: "playsculptor@gmail.com"
  },
  {
    rank: "in-training",
    email: "gguillory2015@gmail.com"
  },
  {
    rank: "in-training",
    email: "spgppy@gmail.com"
  },
  {
    rank: "in-training",
    email: "pacificellie@gmail.com"
  },
  {
    rank: "in-training",
    email: "jberg22@wisc.edu"
  },
  {
    rank: "in-training",
    email: "tinydave17@gmail.com"
  },
  {
    rank: "in-training",
    email: "alexmoquist@gmail.com"
  },
  {
    rank: "in-training",
    email: "michelle.kathleen@live.com"
  },
  {
    rank: "in-training",
    email: "bigfootbros03@gmail.com"
  },
  {
    rank: "in-training",
    email: "blank.john14@gmail.com"
  },
  {
    rank: "in-training",
    email: "tyler@tlcombs.com"
  },
  {
    rank: "in-training",
    email: "cam.conable@gmail.com"
  },
  {
    rank: "in-training",
    email: "jknepp93@gmail.com"
  },
  {
    rank: "in-training",
    email: "taimiarvidson@gmail.com"
  },
  {
    rank: "in-training",
    email: "samchi848@gmail.com"
  },
  {
    rank: "in-training",
    email: "pallavi.bugga@gmail.com"
  },
  {
    rank: "in-training",
    email: "emmanuel.mauleon@gmail.com"
  },
  {
    rank: "in-training",
    email: "reid.holland23@gmail.com"
  },
  {
    rank: "in-training",
    email: "josh@hailmail.net"
  },
  {
    rank: "in-training",
    email: "femvest@yahoo.com"
  },
  {
    rank: "in-training",
    email: "chris0712123@gmail.com"
  },
  {
    rank: "in-training",
    email: "alexandracossack@gmail.com"
  },
  {
    rank: "in-training",
    email: "johnsonaguilar@gmail.com"
  },
  {
    rank: "in-training",
    email: "andreaparker@protonmail.ch"
  },
  {
    rank: "in-training",
    email: "brandonmaki@outlook.com"
  },
  {
    rank: "in-training",
    email: "joal.mendonsa@gmail.com"
  },
  {
    rank: "in-training",
    email: "tylergangloff@gmail.com"
  },
  {
    rank: "in-training",
    email: "huntersokol@gmail.com"
  },
  {
    rank: "in-training",
    email: "aidan.thomsen@gmail.com"
  },
  {
    rank: "in-training",
    email: "meghankathrynchristie@gmail.com"
  },
  {
    rank: "in-training",
    email: "mamcmillan17@gmail.com"
  },
  {
    rank: "in-training",
    email: "dhearn73@yahoo.com"
  },
  {
    rank: "in-training",
    email: "ainsleypaigereynolds@gmail.com"
  },
  {
    rank: "in-training",
    email: "padlerpaul@gmail.com"
  },
  {
    rank: "in-training",
    email: "fastkent333@gmail.com"
  },
  {
    rank: "in-training",
    email: "annabeljallen@yahoo.com"
  },
  {
    rank: "in-training",
    email: "nimasoleimani@hotmail.com"
  },
  {
    rank: "in-training",
    email: "kallinr.york@gmail.com"
  },
  {
    rank: "in-training",
    email: "katywaitt@msn.com"
  },
  {
    rank: "in-training",
    email: "kyle.david.garrett@gmail.com"
  },
  {
    rank: "in-training",
    email: "katileecallahan@gmail.com"
  },
  {
    rank: "in-training",
    email: "lanerossidel91@yahoo.com"
  },
  {
    rank: "in-training",
    email: "eddie.chirino@gmail.com"
  },
  {
    rank: "in-training",
    email: "sherice.hayes@yahoo.com"
  },
  {
    rank: "in-training",
    email: "bensoncharles123@gmail.com"
  },
  {
    rank: "in-training",
    email: "sophie.e.taus@gmail.com"
  },
  {
    rank: "in-training",
    email: "jakehratner@gmail.com"
  },
  {
    rank: "in-training",
    email: "pehobaugh@gmail.com"
  },
  {
    rank: "in-training",
    email: "wiiblausman@gmail.com"
  },
  {
    rank: "in-training",
    email: "joeparker1301@gmail.com"
  },
  {
    rank: "in-training",
    email: "darius.s.adel@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryan.t.morey@gmail.com"
  },
  {
    rank: "in-training",
    email: "chrismksyoung@gmail.com"
  },
  {
    rank: "in-training",
    email: "daniel.llc.wong@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryanbrooks0815@gmail.com"
  },
  {
    rank: "in-training",
    email: "lamsok842@myemail.northland.edu"
  },
  {
    rank: "in-training",
    email: "mahoney24@gmail.com"
  },
  {
    rank: "in-training",
    email: "ajayjakate+bernie@gmail.com"
  },
  {
    rank: "in-training",
    email: "sarmarkoch@gmail.com"
  },
  {
    rank: "in-training",
    email: "chrisrgrande@gmail.com"
  },
  {
    rank: "in-training",
    email: "jessiesettle@gmail.com"
  },
  {
    rank: "in-training",
    email: "duncanfelton@gmail.com"
  },
  {
    rank: "in-training",
    email: "carlyjcody@gmail.com"
  },
  {
    rank: "in-training",
    email: "vishenka1973@gmail.com"
  },
  {
    rank: "in-training",
    email: "bermanator149@gmail.com"
  },
  {
    rank: "in-training",
    email: "nicolettely@gmail.com"
  },
  {
    rank: "in-training",
    email: "shan.switzer@gmail.com"
  },
  {
    rank: "in-training",
    email: "avfghg@gmail.com"
  },
  {
    rank: "in-training",
    email: "tongassoliver@gmail.com"
  },
  {
    rank: "in-training",
    email: "nschamus@gmail.com"
  },
  {
    rank: "in-training",
    email: "mhanning@pm.me"
  },
  {
    rank: "in-training",
    email: "elizabethschwartz70@yahoo.com"
  },
  {
    rank: "in-training",
    email: "jono@jonothing.com"
  },
  {
    rank: "in-training",
    email: "colejmcglynn@gmail.com"
  },
  {
    rank: "in-training",
    email: "pchechele@comcast.net"
  },
  {
    rank: "in-training",
    email: "danielmichaeldawson@gmail.com"
  },
  {
    rank: "in-training",
    email: "eproulx17@gmail.com"
  },
  {
    rank: "in-training",
    email: "ren.rowena@gmail.com"
  },
  {
    rank: "in-training",
    email: "scolburn54@gmail.com"
  },
  {
    rank: "in-training",
    email: "mikeltod@gmail.com"
  },
  {
    rank: "in-training",
    email: "cath11yy@gmail.com"
  },
  {
    rank: "in-training",
    email: "slack@tkel.ly"
  },
  {
    rank: "in-training",
    email: "davidseecollier@gmail.com"
  },
  {
    rank: "in-training",
    email: "lpalladina@gmail.com"
  },
  {
    rank: "in-training",
    email: "lkadams@student.unimelb.edu.au"
  },
  {
    rank: "in-training",
    email: "sarahcatee@gmail.com"
  },
  {
    rank: "in-training",
    email: "s.mokennen@gmail.com"
  },
  {
    rank: "in-training",
    email: "mortellfiona@gmail.com"
  },
  {
    rank: "in-training",
    email: "thegoldeneternity@yahoo.com"
  },
  {
    rank: "in-training",
    email: "tristynbe@gmail.com"
  },
  {
    rank: "in-training",
    email: "mattmccoll55@hotmail.com"
  },
  {
    rank: "in-training",
    email: "barkerhanna@gmail.com"
  },
  {
    rank: "in-training",
    email: "ushak412@gmail.com"
  },
  {
    rank: "in-training",
    email: "andres4895@hotmail.com"
  },
  {
    rank: "in-training",
    email: "stephen.semcho@gmail.com"
  },
  {
    rank: "in-training",
    email: "crowleyt1402@gmail.com"
  },
  {
    rank: "in-training",
    email: "yluvhrtzu@gmail.com"
  },
  {
    rank: "in-training",
    email: "alondra859@hotmail.com"
  },
  {
    rank: "in-training",
    email: "krerkes@gmail.com"
  },
  {
    rank: "in-training",
    email: "contactmarleneb-bernie2020@yahoo.com"
  },
  {
    rank: "in-training",
    email: "joebroe0814@gmail.com"
  },
  {
    rank: "in-training",
    email: "gemmalisa@icloud.com"
  },
  {
    rank: "in-training",
    email: "allisonshyer@gmail.com"
  },
  {
    rank: "in-training",
    email: "bobschofield1@gmail.com"
  },
  {
    rank: "in-training",
    email: "snorth@ucla.edu"
  },
  {
    rank: "in-training",
    email: "jerrod.maddox@gmail.com"
  },
  {
    rank: "in-training",
    email: "hbporkchop@gmail.com"
  },
  {
    rank: "in-training",
    email: "willie.ellenberg@gmail.com"
  },
  {
    rank: "in-training",
    email: "aditya13111998@gmail.com"
  },
  {
    rank: "in-training",
    email: "courtneycilman@gmail.com"
  },
  {
    rank: "in-training",
    email: "msmith1@berkeley.edu"
  },
  {
    rank: "in-training",
    email: "nkgarcia04@gmail.com"
  },
  {
    rank: "in-training",
    email: "eric.gagnon@outlook.com"
  },
  {
    rank: "in-training",
    email: "antonichcarolyn@gmail.com"
  },
  {
    rank: "in-training",
    email: "mmddgrs@gmail.com"
  },
  {
    rank: "in-training",
    email: "istaccun@wellesley.edu"
  },
  {
    rank: "in-training",
    email: "nickcarbone1@yahoo.com"
  },
  {
    rank: "in-training",
    email: "elwelljl@dukes.jmu.edu"
  },
  {
    rank: "in-training",
    email: "tavitrano0816@gmail.com"
  },
  {
    rank: "in-training",
    email: "mnemonicjack@gmail.com"
  },
  {
    rank: "in-training",
    email: "sseslikaya.orgn@gmail.com"
  },
  {
    rank: "in-training",
    email: "ehusted99@gmail.com"
  },
  {
    rank: "in-training",
    email: "mxcandypaint@gmail.com"
  },
  {
    rank: "in-training",
    email: "chrisbellyay@gmail.com"
  },
  {
    rank: "in-training",
    email: "julseidman@gmail.com"
  },
  {
    rank: "in-training",
    email: "adrianaberusch@gmail.com"
  },
  {
    rank: "in-training",
    email: "nathanielcowper@gmail.com"
  },
  {
    rank: "in-training",
    email: "scotty_mac38@yahoo.com"
  },
  {
    rank: "in-training",
    email: "daniel.zeitlen@gmail.com"
  },
  {
    rank: "in-training",
    email: "evanschwartz3@gmail.com"
  },
  {
    rank: "in-training",
    email: "znewman@umich.edu"
  },
  {
    rank: "in-training",
    email: "digitalynn0329@gmail.com"
  },
  {
    rank: "in-training",
    email: "deseraedias@gmail.com"
  },
  {
    rank: "in-training",
    email: "natehousley@outlook.com"
  },
  {
    rank: "in-training",
    email: "apthoma@gmail.com"
  },
  {
    rank: "in-training",
    email: "kat.griffin@mac.com"
  },
  {
    rank: "in-training",
    email: "megan.hunt19@gmail.com"
  },
  {
    rank: "in-training",
    email: "daniels73001@gmail.com"
  },
  {
    rank: "in-training",
    email: "lindsaylpg@gmail.com"
  },
  {
    rank: "in-training",
    email: "jillian.horowitz@gmail.com"
  },
  {
    rank: "in-training",
    email: "pauloalmeidaaaa@gmail.com"
  },
  {
    rank: "in-training",
    email: "jon.steven.wells@gmail.com"
  },
  {
    rank: "in-training",
    email: "nicoleinlow@yahoo.com"
  },
  {
    rank: "in-training",
    email: "noalbumout@gmail.com"
  },
  {
    rank: "in-training",
    email: "miahardister@gmail.com"
  },
  {
    rank: "in-training",
    email: "henriknd@gmail.com"
  },
  {
    rank: "in-training",
    email: "jvnforreal@gmail.com"
  },
  {
    rank: "in-training",
    email: "gsanchez@berniesanders.com"
  },
  {
    rank: "in-training",
    email: "amyeshreeve@gmail.com"
  },
  {
    rank: "in-training",
    email: "trombonepaul@gmail.com"
  },
  {
    rank: "in-training",
    email: "camillesnell3@gmail.com"
  },
  {
    rank: "in-training",
    email: "authr.black@gmail.com"
  },
  {
    rank: "in-training",
    email: "jess@jesswells.com"
  },
  {
    rank: "in-training",
    email: "lucieraebaker@gmail.com"
  },
  {
    rank: "in-training",
    email: "sophiekaner@gmail.com"
  },
  {
    rank: "in-training",
    email: "cdub360@gmail.com"
  },
  {
    rank: "in-training",
    email: "molleethomas14@gmail.com"
  },
  {
    rank: "in-training",
    email: "alirieck@gmail.com"
  },
  {
    rank: "in-training",
    email: "bohubbard3@gmail.com"
  },
  {
    rank: "in-training",
    email: "presleyanne@gmail.com"
  },
  {
    rank: "in-training",
    email: "evncmp@gmail.com"
  },
  {
    rank: "in-training",
    email: "antonellid99@gmail.com"
  },
  {
    rank: "in-training",
    email: "zayabbasi@gmail.com"
  },
  {
    rank: "in-training",
    email: "michaelseaholm@gmail.com"
  },
  {
    rank: "in-training",
    email: "marciagolibart@gmail.com"
  },
  {
    rank: "in-training",
    email: "jacosta2@oglethorpe.edu"
  },
  {
    rank: "in-training",
    email: "neil@studio-akahige.com"
  },
  {
    rank: "in-training",
    email: "leon.leontyev@gmail.com"
  },
  {
    rank: "in-training",
    email: "checkjill@gmail.com"
  },
  {
    rank: "in-training",
    email: "tommyordster@gmail.com"
  },
  {
    rank: "in-training",
    email: "jackdowell4@gmail.com"
  },
  {
    rank: "in-training",
    email: "tesseliza@gmail.com"
  },
  {
    rank: "in-training",
    email: "melanie.fossinger@gmail.com"
  },
  {
    rank: "in-training",
    email: "njcain@tutanota.com"
  },
  {
    rank: "in-training",
    email: "danichav4berniesanders@yahoo.com"
  },
  {
    rank: "in-training",
    email: "reidel.jonah@gmail.com"
  },
  {
    rank: "in-training",
    email: "sschamrowski@gmail.com"
  },
  {
    rank: "in-training",
    email: "jennifer.dowling1@yahoo.com"
  },
  {
    rank: "in-training",
    email: "logthomas92@gmail.com"
  },
  {
    rank: "in-training",
    email: "aaron.adrignola@gmail.com"
  },
  {
    rank: "in-training",
    email: "cgward879@gmail.com"
  },
  {
    rank: "in-training",
    email: "davidnifong@gmail.com"
  },
  {
    rank: "in-training",
    email: "spidermarr94@gmail.com"
  },
  {
    rank: "in-training",
    email: "andrewvpemberton@gmail.com"
  },
  {
    rank: "in-training",
    email: "jbronson@gmail.com"
  },
  {
    rank: "in-training",
    email: "marsingtrace@gmail.com"
  },
  {
    rank: "in-training",
    email: "tday244@gmail.com"
  },
  {
    rank: "in-training",
    email: "howardchristian50@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryanflood5@gmail.com"
  },
  {
    rank: "in-training",
    email: "tcastagnoli1025@gmail.com"
  },
  {
    rank: "in-training",
    email: "sammsa8@gmail.com"
  },
  {
    rank: "in-training",
    email: "erica.gordon443@gmail.com"
  },
  {
    rank: "in-training",
    email: "mikayla.kinnison@gmail.com"
  },
  {
    rank: "in-training",
    email: "jnoropeza@yahoo.com"
  },
  {
    rank: "in-training",
    email: "xkaddengagex@gmail.com"
  },
  {
    rank: "in-training",
    email: "cam.schnackel@gmail.com"
  },
  {
    rank: "in-training",
    email: "ecollins2307@gmail.com"
  },
  {
    rank: "in-training",
    email: "alistairtruman@gmail.com"
  },
  {
    rank: "in-training",
    email: "brandonjmckane@gmail.com"
  },
  {
    rank: "in-training",
    email: "shawngies22@gmail.com"
  },
  {
    rank: "in-training",
    email: "andrew.stewart.art@gmail.com"
  },
  {
    rank: "in-training",
    email: "williams.nicholas.p@gmail.com"
  },
  {
    rank: "in-training",
    email: "ari.edmundson@gmail.com"
  },
  {
    rank: "in-training",
    email: "ferrisjeremy1@gmail.com"
  },
  {
    rank: "in-training",
    email: "cateliper@gmail.com"
  },
  {
    rank: "in-training",
    email: "sandy.valdi@gmail.com"
  },
  {
    rank: "in-training",
    email: "mnjhunt@gmail.com"
  },
  {
    rank: "in-training",
    email: "kellan@duneachfarm.com"
  },
  {
    rank: "in-training",
    email: "piemont.alexander@gmail.com"
  },
  {
    rank: "in-training",
    email: "carriemarieallen@yahoo.com"
  },
  {
    rank: "in-training",
    email: "derrick.c.crowe@gmail.com"
  },
  {
    rank: "in-training",
    email: "melanie.brazzell@gmail.com"
  },
  {
    rank: "in-training",
    email: "vitsenyl@hotmail.com"
  },
  {
    rank: "in-training",
    email: "lydiakgm@gmail.com"
  },
  {
    rank: "in-training",
    email: "j_gouker@yahoo.com"
  },
  {
    rank: "in-training",
    email: "brown.nicholasd@gmail.com"
  },
  {
    rank: "in-training",
    email: "kareem.bagdadi@gmail.com"
  },
  {
    rank: "in-training",
    email: "jeremy3791@gmail.com"
  },
  {
    rank: "in-training",
    email: "vmendez1212@gmail.com"
  },
  {
    rank: "in-training",
    email: "margie.powe@gmail.com"
  },
  {
    rank: "in-training",
    email: "crblocher@gwu.edu"
  },
  {
    rank: "in-training",
    email: "mya@blackmon.org"
  },
  {
    rank: "in-training",
    email: "jgradybenson@gmail.com"
  },
  {
    rank: "in-training",
    email: "awengca@gmail.com"
  },
  {
    rank: "in-training",
    email: "hollowayseanm@gmail.com"
  },
  {
    rank: "in-training",
    email: "pgotobed@gmail.com"
  },
  {
    rank: "in-training",
    email: "nickhart@gmail.com"
  },
  {
    rank: "in-training",
    email: "sarahjunk@carlus.net"
  },
  {
    rank: "in-training",
    email: "lovemusicinme@gmail.com"
  },
  {
    rank: "in-training",
    email: "albhub@gmx.com"
  },
  {
    rank: "in-training",
    email: "jaydiller76@gmail.com"
  },
  {
    rank: "in-training",
    email: "adamrose400@gmail.com"
  },
  {
    rank: "in-training",
    email: "brendanseanegan@gmail.com"
  },
  {
    rank: "in-training",
    email: "rmurphy88@yahoo.com"
  },
  {
    rank: "in-training",
    email: "jessica.kurose@gmail.com"
  },
  {
    rank: "in-training",
    email: "jdmattling@gmail.com"
  },
  {
    rank: "in-training",
    email: "sharrisbvt@gmail.com"
  },
  {
    rank: "in-training",
    email: "lxklein@gmail.com"
  },
  {
    rank: "in-training",
    email: "griffin.brandon@gmail.com"
  },
  {
    rank: "in-training",
    email: "mdaugherty88@gmail.com"
  },
  {
    rank: "in-training",
    email: "letterboxgirl@gmail.com"
  },
  {
    rank: "in-training",
    email: "illesial@gmail.com"
  },
  {
    rank: "in-training",
    email: "connerbenjamin099@gmail.com"
  },
  {
    rank: "in-training",
    email: "allegra_chapman@brown.edu"
  },
  {
    rank: "in-training",
    email: "mjp9029@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryan.stumpf@gmail.com"
  },
  {
    rank: "in-training",
    email: "bryan.mccollom@gmail.com"
  },
  {
    rank: "in-training",
    email: "trinky@gmail.com"
  },
  {
    rank: "in-training",
    email: "bradleyaswain@gmail.com"
  },
  {
    rank: "in-training",
    email: "corral.destiny@gmail.com"
  },
  {
    rank: "in-training",
    email: "kelseylizotte@gmail.com"
  },
  {
    rank: "in-training",
    email: "alexandraruley@gmail.com"
  },
  {
    rank: "in-training",
    email: "collateralcinemamoviepodcast@gmail.com"
  },
  {
    rank: "in-training",
    email: "bridget@domenighini.com"
  },
  {
    rank: "in-training",
    email: "madisonalexisseely@gmail.com"
  },
  {
    rank: "in-training",
    email: "caasha25aisha@gmail.com"
  },
  {
    rank: "in-training",
    email: "ervin.kristin@gmail.com"
  },
  {
    rank: "in-training",
    email: "daisyhomolka@gmail.com"
  },
  {
    rank: "in-training",
    email: "alexa.schendel@gmail.com"
  },
  {
    rank: "in-training",
    email: "katie.kasmir@gmail.com"
  },
  {
    rank: "in-training",
    email: "tiagojlferreira97@outlook.pt"
  },
  {
    rank: "in-training",
    email: "rodrigm@bu.edu"
  },
  {
    rank: "in-training",
    email: "californicated@usa.com"
  },
  {
    rank: "in-training",
    email: "groydcle@gmail.com"
  },
  {
    rank: "in-training",
    email: "jesmel74@icloud.com"
  },
  {
    rank: "in-training",
    email: "brentcayson@gmail.com"
  },
  {
    rank: "in-training",
    email: "efegbert@gmail.com"
  },
  {
    rank: "in-training",
    email: "nabil.bensalaheddine@gmail.com"
  },
  {
    rank: "in-training",
    email: "harry.d.burgess@gmail.com"
  },
  {
    rank: "in-training",
    email: "carmen_jauregui@hotmail.com"
  },
  {
    rank: "in-training",
    email: "mariaquintana0220@gmail.com"
  },
  {
    rank: "in-training",
    email: "mpike21797@gmail.com"
  },
  {
    rank: "in-training",
    email: "graingerjackson@msn.com"
  },
  {
    rank: "in-training",
    email: "olivia.gandee@roeper.org"
  },
  {
    rank: "in-training",
    email: "mmebienvenu@gmail.com"
  },
  {
    rank: "in-training",
    email: "sydnie.mccormick@gmail.com"
  },
  {
    rank: "in-training",
    email: "mattsmith.eu@gmail.com"
  },
  {
    rank: "in-training",
    email: "nate.knauf2@gmail.com"
  },
  {
    rank: "in-training",
    email: "elizabethpearllewis@gmail.com"
  },
  {
    rank: "in-training",
    email: "estenacooke@gmail.com"
  },
  {
    rank: "in-training",
    email: "spades09@gmail.com"
  },
  {
    rank: "in-training",
    email: "zan.atay@gmail.com"
  },
  {
    rank: "in-training",
    email: "gail.noyer@wanadoo.fr"
  },
  {
    rank: "in-training",
    email: "zerkzyz@gmail.com"
  },
  {
    rank: "in-training",
    email: "quintynbreeuwer@gmail.com"
  },
  {
    rank: "in-training",
    email: "megananneclements@gmail.com"
  },
  {
    rank: "in-training",
    email: "alexterrestrial@tutanota.de"
  },
  {
    rank: "in-training",
    email: "mpopiel@gmx.com"
  },
  {
    rank: "in-training",
    email: "mike.keegan.reads.this@gmail.com"
  },
  {
    rank: "in-training",
    email: "finchaj@miamioh.edu"
  },
  {
    rank: "in-training",
    email: "tgrinb@gmail.com"
  },
  {
    rank: "in-training",
    email: "branche1@kenyon.edu"
  },
  {
    rank: "in-training",
    email: "dmaebert1@gmail.com"
  },
  {
    rank: "in-training",
    email: "eastonlkelley@gmail.com"
  },
  {
    rank: "in-training",
    email: "ella@colcord.net"
  },
  {
    rank: "in-training",
    email: "4614051@gmail.com"
  },
  {
    rank: "in-training",
    email: "ekisner2@kent.edu"
  },
  {
    rank: "in-training",
    email: "mvkruijss@gmail.com"
  },
  {
    rank: "in-training",
    email: "gilesharvey@hotmail.com"
  },
  {
    rank: "in-training",
    email: "smann85@gmail.com"
  },
  {
    rank: "in-training",
    email: "zionbr7@gmail.com"
  },
  {
    rank: "in-training",
    email: "hiro.matzuda.latorre@gmail.com"
  },
  {
    rank: "in-training",
    email: "justin.vieira@gmail.com"
  },
  {
    rank: "in-training",
    email: "jordanpotter@gmail.com"
  },
  {
    rank: "in-training",
    email: "jackwarn02@gmail.com"
  },
  {
    rank: "in-training",
    email: "dreqqus@gmail.com"
  },
  {
    rank: "in-training",
    email: "wattsmart@gmail.com"
  },
  {
    rank: "in-training",
    email: "delao.moravia@gmail.com"
  },
  {
    rank: "in-training",
    email: "ira.zukanovic@gmail.com"
  },
  {
    rank: "in-training",
    email: "joycehazeltine@gmail.com"
  },
  {
    rank: "in-training",
    email: "eamoore17@gmail.com"
  },
  {
    rank: "in-training",
    email: "diegoduarte2828@gmail.com"
  },
  {
    rank: "in-training",
    email: "christine.montero@gmail.com"
  },
  {
    rank: "in-training",
    email: "mia.trana@mail.mcgill.ca"
  },
  {
    rank: "in-training",
    email: "justindeal86@gmail.com"
  },
  {
    rank: "in-training",
    email: "zoerabrams@gmail.com"
  },
  {
    rank: "in-training",
    email: "skgodin@gmail.com"
  },
  {
    rank: "in-training",
    email: "elli@messyelliott.rocks"
  },
  {
    rank: "in-training",
    email: "brew2echo@gmail.com"
  },
  {
    rank: "in-training",
    email: "nate.lambeth@gmail.com"
  },
  {
    rank: "in-training",
    email: "emprins@gmail.com"
  },
  {
    rank: "in-training",
    email: "jmomesso@outlook.com"
  },
  {
    rank: "in-training",
    email: "rcekdk@gmail.com"
  },
  {
    rank: "in-training",
    email: "ctaff001@fiu.edu"
  },
  {
    rank: "in-training",
    email: "arios6499@yahoo.com"
  },
  {
    rank: "in-training",
    email: "mmitri02@gmail.com"
  },
  {
    rank: "in-training",
    email: "carinemily@gmail.com"
  },
  {
    rank: "in-training",
    email: "brendanmccarthy84@gmail.com"
  },
  {
    rank: "in-training",
    email: "lukenemy7@gmail.com"
  },
  {
    rank: "in-training",
    email: "nicoledallar@gmail.com"
  },
  {
    rank: "in-training",
    email: "britnaymae1@gmail.com"
  },
  {
    rank: "in-training",
    email: "angelarosechristopher@gmail.com"
  },
  {
    rank: "in-training",
    email: "msmallwood@wisc.edu"
  },
  {
    rank: "in-training",
    email: "nfb6@duke.edu"
  },
  {
    rank: "in-training",
    email: "kilcoyne.daniel@gmail.com"
  },
  {
    rank: "in-training",
    email: "babrandon21@gmail.com"
  },
  {
    rank: "in-training",
    email: "j.h.montoro@gmail.com"
  },
  {
    rank: "in-training",
    email: "maddie.sage@hotmail.com"
  },
  {
    rank: "in-training",
    email: "matthewjohndolezal@gmail.com"
  },
  {
    rank: "in-training",
    email: "ryan@ryanlucht.com"
  },
  {
    rank: "in-training",
    email: "abigailademos@gmail.com"
  },
  {
    rank: "in-training",
    email: "cbwaizenegger@gmail.com"
  },
  {
    rank: "in-training",
    email: "kathleenoc@earthlink.net"
  },
  {
    rank: "in-training",
    email: "etarazk@gmail.com"
  },
  {
    rank: "in-training",
    email: "charliejohnston100@gmail.com"
  },
  {
    rank: "in-training",
    email: "hannahwischnia@gmail.com"
  },
  {
    rank: "in-training",
    email: "jennifercaiello@gmail.com"
  },
  {
    rank: "in-training",
    email: "nathanfrontiero@gmail.com"
  },
  {
    rank: "in-training",
    email: "vrp8ea@virginia.edu"
  },
  {
    rank: "in-training",
    email: "mdedeo@gmail.com"
  },
  {
    rank: "in-training",
    email: "karleecraft01@gmail.com"
  },
  {
    rank: "in-training",
    email: "mission@adaptivesocialresearch.org"
  },
  {
    rank: "in-training",
    email: "everyword@gmail.com"
  },
  {
    rank: "in-training",
    email: "jsusselm@gmail.com"
  },
  {
    rank: "in-training",
    email: "sam.stein617@gmail.com"
  },
  {
    rank: "in-training",
    email: "csullivanb@gmail.com"
  },
  {
    rank: "in-training",
    email: "rdelucia90@gmail.com"
  },
  {
    rank: "in-training",
    email: "andrearociol@gmail.com"
  },
  {
    rank: "in-training",
    email: "magnus.bernhardsen@gmail.com"
  },
  {
    rank: "in-training",
    email: "newbluefireflames@hotmail.com"
  },
  {
    rank: "in-training",
    email: "maryeddy123@gmail.com"
  },
  {
    rank: "in-training",
    email: "blucas1999@gmail.com"
  },
  {
    rank: "in-training",
    email: "kalaylajayla@gmail.com"
  },
  {
    rank: "in-training",
    email: "ericfoutch@cox.net"
  },
  {
    rank: "in-training",
    email: "cjwilson1985@gmail.com"
  },
  {
    rank: "in-training",
    email: "adamkfowler@gmail.com"
  },
  {
    rank: "in-training",
    email: "sshaharyar@gmail.com"
  },
  {
    rank: "in-training",
    email: "boomboxer@gmail.com"
  },
  {
    rank: "in-training",
    email: "zarakijaegerjaquez@gmail.com"
  },
  {
    rank: "in-training",
    email: "maxbastow@gmail.com"
  },
  {
    rank: "in-training",
    email: "joejatcko@gmail.com"
  },
  {
    rank: "in-training",
    email: "jbalog84@gmail.com"
  },
  {
    rank: "in-training",
    email: "scotwilson@gmail.com"
  },
  {
    rank: "in-training",
    email: "breannaxpotts@gmail.com"
  },
  {
    rank: "in-training",
    email: "john.oconnor@gmail.com"
  },
  {
    rank: "in-training",
    email: "jpriemer9771@gmail.com"
  },
  {
    rank: "in-training",
    email: "imgettingcoffee@gmail.com"
  },
  {
    rank: "in-training",
    email: "cegibbs13@gmail.com"
  }
];

const main = async () => {
  const now = new Date();
  // now.setMinutes(now.getMinutes() - 5.5);
  now.setDate(now.getDate() - 4);
  const fiveAndAHalfMinutesAgo = now;

  // const texterRankUpdates = await assignmentManagerDb("berniesms_texter")
  //   .select("rank", "email")
  //   .join("auth_user", "auth_user.id", "=", "user_id")
  //   .where(
  //     "berniesms_texter.updated_at",
  //     ">",
  //     fiveAndAHalfMinutesAgo.toISOString()
  //   );

  for (const texterRank of texterRankUpdates) {
    const { email, rank } = texterRank;

    if (TEXTER_STATUS_MAP[rank]) {
      await spokeDb("user_organization")
        .update({
          request_status: TEXTER_STATUS_MAP[rank]
        })
        .whereIn(
          "user_id",
          spokeDb("user")
            .select("id")
            .where({ email })
        );

      console.log(`Updated rank for ${email} to ${rank}`);
    }
  }
};

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Update texter status failed", err);
    process.exit(1);
  });
