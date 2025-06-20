(async function() {
  function waitForElementInFrame(frame, selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        try {
          const doc = frame.document || frame.contentDocument;
          const el = doc.querySelector(selector);
          if (el) return resolve(el);
        } catch (e) {}

        if (Date.now() - start > timeout) {
          return reject(`Timeout: ${selector} not found in frame`);
        }
        setTimeout(check, 500);
      };
      check();
    });
  }

  // 1️⃣ Get all frames
  const allFrames = Array.from(window.frames);
  console.log(`🔍 Found ${allFrames.length} frames`);

  // 2️⃣ Find the frame containing the Account Statement link
  let accountFrame = null;
  for (const frame of allFrames) {
    try {
      const doc = frame.document || frame.contentDocument;
      const link = Array.from(doc.querySelectorAll('a'))
        .find(a => a.textContent.trim() === 'Account Statement');
      if (link) {
        accountFrame = frame;
        break;
      }
    } catch (e) {}
  }

  if (!accountFrame) {
    console.error("❌ Couldn't find frame with Account Statement link.");
    return;
  }

  console.log('✅ Clicking Account Statement link inside frame...');
  const link = accountFrame.document.querySelector('a[onclick*="acct_stmt"]');
  link.click();

  // 3️⃣ Wait for the View button to appear (could be in a different frame)
  let viewFrame = null;
  let viewButton = null;

  console.log('⏳ Waiting for View Account Statement button...');
  await new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      for (const frame of allFrames) {
        try {
          const doc = frame.document || frame.contentDocument;
          const btn = doc.querySelector('input[type="submit"][name="value(submit1)"]');
          if (btn) {
            viewFrame = frame;
            viewButton = btn;
            clearInterval(interval);
            resolve();
            return;
          }
        } catch (e) {}
      }
    }, 500);
  });

  if (!viewButton) {
    console.error('❌ View Account Statement button not found.');
    return;
  }

  console.log('✅ Clicking View Account Statement button...');
  viewButton.click();

  // 4️⃣ Wait and scroll inside frame with <layer id="DateTime">
  console.log('⏳ Searching for frame containing <layer id="DateTime">...');
  let dataFrame = null;

  await new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      for (const frame of allFrames) {
        try {
          const doc = frame.document || frame.contentDocument;
          if (doc.querySelector('layer#DateTime')) {
            dataFrame = frame;
            clearInterval(interval);
            resolve();
            return;
          }
        } catch (e) {}
      }
    }, 1000);
  });

  if (!dataFrame) {
    console.error('❌ Could not find frame with <layer id="DateTime">');
    return;
  }

  console.log('✅ Scrolling in data frame body...');
  const dataDoc = dataFrame.document || dataFrame.contentDocument;
  dataDoc.body.scrollTop = 1000; // You can adjust this value as needed

})();
