import React from 'react';
import classNames from 'classnames';

const ProgressBar = ({ progress }) => {
  console.log(progress)
  let progressInt = parseInt(progress)
  const progressClassPrefix = `progress-bar__progress--step-`
  const progressClassNames = {
      [`${progressClassPrefix}1`]: progressInt <= 33,
      [`${progressClassPrefix}2`]: progressInt > 33 && progressInt <= 66,
      [`${progressClassPrefix}3`]: progressInt > 66 && progressInt <= 99,
      [`${progressClassPrefix}completed`]: progressInt === 100
  }

  return (

      <div
          className={classNames('progress-bar__progress', progressClassNames)}
          style={{ width: progress + '%' }}>
          <div className="progress-bar__tick-wrapper">
              <svg className='progress-bar__tick icon-tick' viewBox='0 0 512 512'><path d="m135 280l97 97c20 20 20 52 0 72-20 20-53 20-73 0l-96-96c-20-20-20-53 0-73 20-20 52-20 72 0z m300-106c20 20 20 52 0 72l-193 193c-20 20-53 20-73 0-20-20-20-52 0-72l194-193c20-20 52-20 72 0z" /></svg>
          </div>
      </div>

  )
}

export default ProgressBar