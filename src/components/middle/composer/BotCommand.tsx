import type { FC } from '../../../lib/teact/teact';
import React, { memo } from '../../../lib/teact/teact';

import type { ApiBotCommand, ApiUser } from '../../../api/types';

import buildClassName from '../../../util/buildClassName';
import renderText from '../../common/helpers/renderText';

import Avatar from '../../common/Avatar';
import ListItem from '../../ui/ListItem';

import './BotCommand.scss';

type OwnProps = {
  botCommand: ApiBotCommand;
  bot?: ApiUser;
  withAvatar?: boolean;
  focus?: boolean;
  onClick: (botCommand: ApiBotCommand) => void;
};

const BotCommand: FC<OwnProps> = ({
  withAvatar,
  focus,
  botCommand,
  bot,
  onClick,
}) => {
  return (
    <ListItem
      key={botCommand.command}
      className={buildClassName('BotCommand chat-item-clickable scroll-item', withAvatar && 'with-avatar')}
      multiline
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => onClick(botCommand)}
      focus={focus}
    >
      {withAvatar && (
        <Avatar size="small" peer={bot} />
      )}
      <div className="content-inner">
        <span className="title">/{botCommand.command}</span>
        <span className="subtitle">{renderText(botCommand.description)}</span>
      </div>
    </ListItem>
  );
};

export default memo(BotCommand);
