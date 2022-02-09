import { decodePayloadToTerm } from './index'

describe.skip("test decode", () => {
  it("hardcoded token payload for session", () => {
    const payload = `g2gDaAJhBXQAAAAIZAACaWRtAAAAFHBoeC1Gc3d2Y0NRQUs3RDBUd0toZAAMbGl2ZV9zZXNzaW9uaAJkAAdkZWZhdWx0bggA8NT5024vzBZkAApwYXJlbnRfcGlkZAADbmlsZAAIcm9vdF9waWRkAANuaWxkAAlyb290X3ZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlZAAGcm91dGVyZAAfRWxpeGlyLkxpdmVWaWV3U3R1ZGlvV2ViLlJvdXRlcmQAB3Nlc3Npb250AAAAAGQABHZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlbgYAkgTxen4BYgABUYA`
    const _ = decodePayloadToTerm(payload, (err, term) => {
      if (err) {
        console.error("error", err)
      }
      else {
        console.log("session term", term)
        console.log(term[0][1])
        /** Outputs:
         *  TODO: worth parsing more?
         * OtpErlangMap {
      value: {
        'OtpErlangAtom(id,false)': OtpErlangBinary {
          value: <Buffer 70 68 78 2d 46 73 77 76 63 43 51 41 4b 37 44 30 54 77 4b 68>,
          bits: 8
        },
        'OtpErlangAtom(live_session,false)': [ [OtpErlangAtom], 1642740117132662000 ],
        'OtpErlangAtom(parent_pid,false)': OtpErlangAtom { value: 'nil', utf8: false },
        'OtpErlangAtom(root_pid,false)': OtpErlangAtom { value: 'nil', utf8: false },
        'OtpErlangAtom(root_view,false)': OtpErlangAtom {
          value: 'Elixir.LiveViewStudioWeb.LightLive',
          utf8: false
        },
        'OtpErlangAtom(router,false)': OtpErlangAtom {
          value: 'Elixir.LiveViewStudioWeb.Router',
          utf8: false
        },
        'OtpErlangAtom(session,false)': OtpErlangMap { value: {} },
        'OtpErlangAtom(view,false)': OtpErlangAtom {
          value: 'Elixir.LiveViewStudioWeb.LightLive',
          utf8: false
        }
      }
    }
         */
        console.log(term[0][1].value)

      }
    })

  });

  it("hardcoded token payload for statics", () => {
    const payload = `g2gDaAJhBXQAAAADZAAKYXNzaWduX25ld2pkAAVmbGFzaHQAAAAAZAACaWRtAAAAFHBoeC1Gc3d2Y0NRQUs3RDBUd0tobgYAkgTxen4BYgABUYA`;
    const term = decodePayloadToTerm(payload, (err, term) => {
      if (err) {
        console.error("error", err)
      }
      else {
        console.log("statics term", term)
        console.log(term[0][1])
        // const termJson = JSON.parse(term);
        // console.log("statics term", term, termJson)
      }
    })
  })

});