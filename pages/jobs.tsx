import { GetServerSidePropsContext } from "next"
import { NextRouter, useRouter } from "next/router"
import React, { useEffect } from "react"

const OPEN_JOB_TAB = "open"
const UPCOMING_JOB_TAB = "upcoming"
const PENDING_JOB_TAB = "pending"
const validJobTabs = [OPEN_JOB_TAB, UPCOMING_JOB_TAB, PENDING_JOB_TAB]
const openJobHref = "/jobs?tab=open"

function isValidTabs(ctx: NextRouter | GetServerSidePropsContext) {
  return (
    typeof ctx.query.tab === "string" && validJobTabs.includes(ctx.query.tab)
  )
}

function Jobs(): JSX.Element {
  const router = useRouter()
  const tab = router.query.tab || "open"

  useEffect(() => {
    if (!isValidTabs(router)) {
      router.push(openJobHref)
    }
  }, [router])

  return (
    <main>
      {tab === OPEN_JOB_TAB && <div>Open</div>}
      {tab === UPCOMING_JOB_TAB && <div>upcoming</div>}
      {tab === PENDING_JOB_TAB && <div>pending</div>}
    </main>
  )
}

// Jobs.getLayout = getBaseLayout

export default Jobs

// export const getServerSideProps: GetServerSideProps = async (ctx) => {
//  if (!isValidTabs(ctx)) {
//    return {
//      redirect: {
//        destination: openJobHref,
//        permanent: false,
//      },
//    }
//  }
//
//  return {
//    props: {},
//  }
// }
